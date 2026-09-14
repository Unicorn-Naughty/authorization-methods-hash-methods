import { Request, Response, NextFunction } from "express";

import { ZodType } from "zod";

export const validate = (schemas: { body?: ZodType; params?: ZodType; query?: ZodType }) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
      } else {
        req[key] = result.data;
      }
    }
    if (details.length > 0) {
      res.status(400).json({ error: "validation", details });
      return;
    }
    next();
  };
};
