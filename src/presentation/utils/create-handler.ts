import type { Request, Response, RequestHandler } from "express";

export const createHandler = <TBody = any, TParams = any, TQuery = any>(
  handler: (req: Request<TParams, any, TBody, TQuery>, res: Response) => Promise<void>,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      await handler(req as Request<TParams, any, TBody, TQuery>, res);
    } catch (error) {
      next(error);
    }
  };
};
