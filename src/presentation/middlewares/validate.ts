import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../../domain/errors";

export const validate = (schemas: { body?: ZodType; params?: ZodType; query?: ZodType }) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const keys = ["body", "params", "query"] as const;
    const details: Array<{ path: string; message: string }> = [];

    for (const key of keys) {
      const schema = schemas[key];

      if (!schema) continue;

      const result = schema.safeParse(req[key]);

      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            path: [key, ...issue.path].join("."),
            message: issue.message,
          });
        }
        continue;
      }

      if (key === "query") {
        Object.defineProperty(req, "query", {
          value: result.data,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      } else {
        req[key] = result.data;
      }
    }

    if (details.length > 0) {
      next(new AppError("validation error", 400, details));
      return;
    }

    next();
  };
};
