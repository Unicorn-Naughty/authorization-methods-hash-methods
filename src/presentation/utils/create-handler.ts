import type { Request, Response, RequestHandler } from "express";

export const createHandler = <TBody = unknown, TParams = unknown, TQuery = unknown>(
  handler: (req: Request<TParams, unknown, TBody, TQuery>, res: Response) => Promise<void>,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      await handler(req as Request<TParams, unknown, TBody, TQuery>, res);
    } catch (error) {
      next(error);
    }
  };
};
