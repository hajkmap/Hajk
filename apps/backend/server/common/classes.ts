import HttpStatusCodes from "./HttpStatusCodes.ts";

/**
 * Error with status code and message.
 */
export class RouteError extends Error {
  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Validation error due to user input
 */
export class ValidationError extends RouteError {
  public constructor(message: string) {
    super(HttpStatusCodes.BAD_REQUEST, ValidationError.getMessage(message));
  }

  public static getMessage(param: string) {
    return param;
  }
}

/**
 * Validation error due to user input
 */
export class HajkError extends RouteError {
  public hajkCode: string;

  public constructor(
    status: HttpStatusCodes,
    message: string,
    hajkCode: string
  ) {
    super(status, message);
    this.hajkCode = hajkCode;
  }
}
