export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string = 'DOMAIN_ERROR') {
    super(message);
    this.code = code;
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, identifier: string | number) {
    super(`${entityName} con identificador "${identifier}" no fue encontrado.`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR');
    this.fields = fields;
    this.name = 'ValidationError';
  }
}

export class NetworkError extends DomainError {
  constructor(message: string = 'Error de comunicación con el servidor remoto.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
