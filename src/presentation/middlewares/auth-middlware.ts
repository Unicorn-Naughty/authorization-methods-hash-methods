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
    const user_id = tokenService.verifyAccessToken(cleanedToken);
    if (!user_id) {
      return next(new AppError("Unauthorized", 401));
    }

    req.user_id = user_id;
    return next();
  };
}
