export class AccessError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "AccessError";
  }
}

export class NotFoundError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "NotFoundError";
  }
}
