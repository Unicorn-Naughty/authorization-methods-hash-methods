import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors";

export function cookieCsrf(allowedOrigins: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (typeof origin === "string") {
      if (!allowedOrigins.includes(origin)) {
        return next(new AppError("Forbidden", 403));
      }
      return next();
    }

    const referer = req.headers.referer;
    if (typeof referer === "string") {
      try {
        const refererOrigin = new URL(referer).origin;
        if (allowedOrigins.includes(refererOrigin)) {
          return next();
        }
      } catch {
        return next(new AppError("Forbidden", 403));
      }
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
}
