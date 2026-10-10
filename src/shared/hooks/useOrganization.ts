import { useEffect, useState } from 'react';
import { httpClient } from '../infrastructure/http/httpClient';

export interface Organization {
  name: string;
  nit: string;
}

let cache: Organization | null = null;
let inflight: Promise<Organization> | null = null;
const FALLBACK: Organization = { name: 'Asociación', nit: '' };

function load(): Promise<Organization> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = httpClient
      .get<Organization>('/organization')
      .then((r) => (cache = { name: r.data.name || FALLBACK.name, nit: r.data.nit || '' }))
      .catch(() => FALLBACK)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Nombre y NIT de la organización (configurados en el backend) para encabezados de documentos. */
export function useOrganization(): Organization {
  const [org, setOrg] = useState<Organization>(cache ?? FALLBACK);
  useEffect(() => {
    let alive = true;
    void load().then((o) => alive && setOrg(o));
    return () => {
      alive = false;
    };
  }, []);
  return org;
}
