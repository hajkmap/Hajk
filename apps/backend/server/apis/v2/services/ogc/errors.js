export class ServiceError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends ServiceError {
  constructor(message, details) {
    super(message, 404, details);
  }
}

export class UpstreamError extends ServiceError {
  constructor(message, status, details) {
    super(message, status, details);
    this.status = status;
  }
}

export class ValidationError extends ServiceError {
  constructor(message, details) {
    super(message, 400, details);
  }
}
