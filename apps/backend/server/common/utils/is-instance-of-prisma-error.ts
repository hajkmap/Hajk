import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

/**
 * Does best effort at determining if the given error is a Prisma error.
 * @see https://github.com/prisma/prisma/issues/9082
 * @see https://github.com/prisma/prisma/issues/5040
 */
export function isInstanceOfPrismaError(e: Error): boolean {
  return (
    e.constructor.name.includes("Prisma") ||
    e instanceof PrismaClientKnownRequestError ||
    e instanceof PrismaClientUnknownRequestError ||
    e instanceof PrismaClientRustPanicError ||
    e instanceof PrismaClientInitializationError ||
    e instanceof PrismaClientValidationError
  );
}
