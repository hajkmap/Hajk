import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
/*
Tries to parse the request data using the provided schema.
If successful, calls the next middleware function (next()).
If parsing fails, returns a 400 error response with a JSON object containing validation 
errors if the error is a Zod error; otherwise, passes the error to the next middleware function (next(error)).
*/
export const validatePayload = (
  schema: ZodSchema<unknown>,
  source: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          ...error,
        });
      } else {
        next(error);
      }
    }
  };
};
