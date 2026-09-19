import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      err.details ? { message: err.message, details: err.details } : { message: err.message },
    );
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
