import type { Request, Response, NextFunction } from "express";
import type { ITokenService } from "../../application/ports/services";
import { AppError } from "../../shared";

export function authMiddleware(tokenService: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if (!token?.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized", 401));
    }

    const cleanedToken = token.slice(7);
    const userId = tokenService.verifyAccessToken(cleanedToken);
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    req.userId = userId;
    return next();
  };
}
