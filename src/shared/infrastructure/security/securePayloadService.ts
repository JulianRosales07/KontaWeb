/**
 * Centralized service for application payload protection.
 * Implements hybrid encryption (AES-256-GCM + RSA-OAEP-256) with complementary obfuscation.
 * No private cryptographic secrets are stored in the client.
 */

export interface ProtectedPayloadEnvelope {
  keyId: string;
  requestId: string;
  timestamp: number;
  key?: string;
  nonce: string;
  data: string;
}

interface ServerPublicKey {
  keyId: string;
  cryptoKey: CryptoKey;
}

const CAESAR_SHIFT = 13;

class SecurePayloadService {
  private serverKeyPromise: Promise<ServerPublicKey> | null = null;
  private activeServerKey: ServerPublicKey | null = null;
  private pendingRequestKeys = new Map<string, { aesKey: CryptoKey; createdAt: number }>();

  /**
   * Helper: Convert Uint8Array to Base64
   */
  public bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Helper: Convert Base64 to Uint8Array
   */
  public base64ToBytes(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Complementary byte-level transformation
   */
  private applyCaesar(bytes: Uint8Array, shift = CAESAR_SHIFT): Uint8Array {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = (bytes[i] + shift) & 0xff;
    }
    return out;
  }

  /**
   * Reversal of complementary byte-level transformation
   */
  private reverseCaesar(bytes: Uint8Array, shift = CAESAR_SHIFT): Uint8Array {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = (bytes[i] - shift + 256) & 0xff;
    }
    return out;
  }

  /**
   * Converts a PEM public key to a CryptoKey usable with RSA-OAEP
   */
  private async importRsaPublicKey(pem: string): Promise<CryptoKey> {
    const cleanPem = pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const binaryDer = this.base64ToBytes(cleanPem);
    const derBuffer = binaryDer.buffer.slice(
      binaryDer.byteOffset,
      binaryDer.byteOffset + binaryDer.byteLength
    );

    return window.crypto.subtle.importKey(
      'spki',
      derBuffer as ArrayBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Known production public key fallback to avoid cold-start delays
   */
  private static readonly DEFAULT_KEY_ID = '2026-v1';
  private static readonly DEFAULT_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmkvs1v2tM5sUovwtzgjZ
5nsMf9Hiu6+XaXy1XGqvawGriaUzRKlgxXUE5uJxwwBnSMKjTDArnJ+XxhZ7Va+d
DdHgzY9HjzdhZYhK1s24yFii9U+nGUZdktWi88+WvGyxa+Qltyj4CVhUYTWa73Mu
7taIc4fvR86rRQ6q18Ue/dC5ogGNry+sDOOFmfriJd0905lz3+crU9GtrAuRFFeh
EfbOiE2kIkvLA0YCsWEJ4/pQvvPCWrQs4Afsha0IWnYBLdGPrWo7e1lxQRga/tkq
ToRQ9kk/+FJ852X5/hVLlCxOI1xd+ZFw8XpOjYIs/clS7K7rGbf13obf38kL1ooD
VQIDAQAB
-----END PUBLIC KEY-----`;

  /**
   * Refreshes public key from server in background without blocking requests
   */
  private refreshPublicKeyInBackground(baseUrl: string): void {
    if (!baseUrl) return;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    fetch(`${cleanBase}/security/public-key`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data?.publicKey && data?.keyId) {
          try {
            sessionStorage.setItem('konta_sec_key_id', data.keyId);
            sessionStorage.setItem('konta_sec_public_key', data.publicKey);
            // Siempre se reemplaza: tras un reinicio el servidor puede tener otra llave con el mismo identificador
            const cryptoKey = await this.importRsaPublicKey(data.publicKey);
            this.activeServerKey = { keyId: data.keyId, cryptoKey };
          } catch {
            // Non-critical cache error
          }
        }
      })
      .catch(() => {
        // Silent fail on background refresh
      });
  }

  /**
   * Descarta la llave en memoria y en caché y descarga la vigente del servidor.
   * Se usa cuando el servidor rechaza una petición cifrada (p. ej. se reinició con otra llave).
   */
  public async resetPublicKey(baseUrl: string): Promise<void> {
    this.activeServerKey = null;
    this.serverKeyPromise = null;
    try {
      sessionStorage.removeItem('konta_sec_key_id');
      sessionStorage.removeItem('konta_sec_public_key');
    } catch {
      // sessionStorage no disponible
    }
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const res = await fetch(`${cleanBase}/security/public-key`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('No fue posible inicializar el canal seguro de datos.');
    const data = await res.json();
    const cryptoKey = await this.importRsaPublicKey(data.publicKey);
    this.activeServerKey = { keyId: data.keyId, cryptoKey };
    try {
      sessionStorage.setItem('konta_sec_key_id', data.keyId);
      sessionStorage.setItem('konta_sec_public_key', data.publicKey);
    } catch {
      // sessionStorage lleno o deshabilitado
    }
  }

  /**
   * Pre-warms the crypto key in memory
   */
  public async warmUp(baseUrl?: string): Promise<void> {
    try {
      await this.ensurePublicKey(baseUrl || '');
    } catch {
      // Ignored
    }
  }

  /**
   * Fetches and caches server public key for secure channel initialization.
   * Resolves instantly from memory, session cache or verified fallback.
   */
  public async ensurePublicKey(baseUrl: string): Promise<ServerPublicKey> {
    if (this.activeServerKey) {
      return this.activeServerKey;
    }

    // Fast path: use cached or pre-seeded fallback key (0ms network delay)
    const cachedKeyId =
      sessionStorage.getItem('konta_sec_key_id') || SecurePayloadService.DEFAULT_KEY_ID;
    const cachedPem =
      sessionStorage.getItem('konta_sec_public_key') || SecurePayloadService.DEFAULT_PUBLIC_KEY_PEM;

    if (cachedPem) {
      try {
        const cryptoKey = await this.importRsaPublicKey(cachedPem);
        const serverKey: ServerPublicKey = {
          keyId: cachedKeyId,
          cryptoKey,
        };
        this.activeServerKey = serverKey;
        // Refresh asynchronously in the background so future requests have freshest key
        if (baseUrl) {
          this.refreshPublicKeyInBackground(baseUrl);
        }
        return serverKey;
      } catch (err) {
        console.warn('[CanalSeguro] Fallback import failed, falling back to network fetch:', err);
      }
    }

    if (!this.serverKeyPromise) {
      this.serverKeyPromise = (async () => {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const res = await fetch(`${cleanBase}/security/public-key`, {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          throw new Error('No fue posible inicializar el canal seguro de datos.');
        }

        const data = await res.json();
        const cryptoKey = await this.importRsaPublicKey(data.publicKey);
        const serverKey: ServerPublicKey = {
          keyId: data.keyId,
          cryptoKey,
        };
        this.activeServerKey = serverKey;
        try {
          sessionStorage.setItem('konta_sec_key_id', data.keyId);
          sessionStorage.setItem('konta_sec_public_key', data.publicKey);
        } catch {
          // sessionStorage full or disabled
        }
        return serverKey;
      })().finally(() => {
        this.serverKeyPromise = null;
      });
    }

    return this.serverKeyPromise;
  }

  /**
   * Protects an outgoing JSON payload for POST/PUT/PATCH
   */
  public async protectRequest(
    baseUrl: string,
    payload: unknown
  ): Promise<{ envelope: ProtectedPayloadEnvelope; requestId: string }> {
    const serverKey = await this.ensurePublicKey(baseUrl);

    // 1. Generate ephemeral 256-bit AES-GCM key
    const aesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Export raw AES key and encrypt with server RSA public key (RSA-OAEP)
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      serverKey.cryptoKey,
      rawAesKey
    );

    // 3. Serialize and apply complementary transformation
    const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const obfuscated = this.applyCaesar(utf8Bytes);

    // 4. Generate random 12-byte IV and encrypt with AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      obfuscated as BufferSource
    );

    const requestId = crypto.randomUUID();
    const timestamp = Date.now();

    // Cache the ephemeral key for response decryption
    this.pendingRequestKeys.set(requestId, { aesKey, createdAt: timestamp });
    this.cleanupOldPendingKeys();

    const envelope: ProtectedPayloadEnvelope = {
      keyId: serverKey.keyId,
      requestId,
      timestamp,
      key: this.bytesToBase64(new Uint8Array(encryptedKeyBuffer)),
      nonce: this.bytesToBase64(iv),
      data: this.bytesToBase64(new Uint8Array(cipherBuffer)),
    };

    return { envelope, requestId };
  }

  /**
   * Generates secure channel headers for GET / DELETE requests
   */
  public async generateSecureChannelHeaders(
    baseUrl: string
  ): Promise<{ headers: Record<string, string>; requestId: string }> {
    const serverKey = await this.ensurePublicKey(baseUrl);

    const aesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      serverKey.cryptoKey,
      rawAesKey
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const requestId = crypto.randomUUID();
    const timestamp = Date.now();

    this.pendingRequestKeys.set(requestId, { aesKey, createdAt: timestamp });
    this.cleanupOldPendingKeys();

    return {
      headers: {
        'X-Payload-Key': this.bytesToBase64(new Uint8Array(encryptedKeyBuffer)),
        'X-Payload-Nonce': this.bytesToBase64(iv),
        'X-Payload-Key-Id': serverKey.keyId,
        'X-Payload-Request-Id': requestId,
        'X-Payload-Timestamp': timestamp.toString(),
      },
      requestId,
    };
  }

  /**
   * Processes an incoming enveloped response, decrypting and reversing obfuscation
   */
  public async processResponse(envelope: unknown, requestId?: string): Promise<unknown> {
    if (!envelope || typeof envelope !== 'object') {
      return envelope;
    }

    const env = envelope as Partial<ProtectedPayloadEnvelope>;
    if (!env.data || !env.nonce) {
      return envelope;
    }

    const reqId = requestId || env.requestId;
    if (!reqId) {
      throw new Error('No fue posible procesar la información protegida.');
    }

    const entry = this.pendingRequestKeys.get(reqId);
    if (!entry) {
      throw new Error('No fue posible procesar la información protegida.');
    }

    try {
      const cipherBytes = this.base64ToBytes(env.data);
      const ivBytes = this.base64ToBytes(env.nonce);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes as BufferSource },
        entry.aesKey,
        cipherBytes as BufferSource
      );

      const reversedBytes = this.reverseCaesar(new Uint8Array(decryptedBuffer));
      const plaintextJson = new TextDecoder().decode(reversedBytes);

      return JSON.parse(plaintextJson);
    } catch {
      throw new Error('No fue posible procesar la información protegida.');
    } finally {
      this.pendingRequestKeys.delete(reqId);
    }
  }

  private cleanupOldPendingKeys(): void {
    const now = Date.now();
    const TTL = 10 * 60 * 1000; // 10 minutes
    if (this.pendingRequestKeys.size > 200) {
      for (const [k, v] of this.pendingRequestKeys.entries()) {
        if (now - v.createdAt > TTL) {
          this.pendingRequestKeys.delete(k);
        }
      }
    }
  }
}

export const securePayloadService = new SecurePayloadService();
