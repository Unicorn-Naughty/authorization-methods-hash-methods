import { Router } from "express";
import { AuthController } from "../controllers/auth-controller";
import { PostController } from "../controllers/post-controller";
import type { ITokenService } from "../../application/ports/services";
import { authMiddleware } from "../middlewares/auth-middleware";
import { createAuthRouter } from "./auth";
import { createPostRouter } from "./post";

interface RoutesDeps {
  authController: AuthController;
  postController: PostController;
  tokenService: ITokenService;
  allowedOrigins: string[];
}

export function createRoutes(deps: RoutesDeps): Router {
  const router = Router();

  const authMw = authMiddleware(deps.tokenService);

  router.use("/auth", createAuthRouter(deps.authController, deps.allowedOrigins));
  router.use("/posts", createPostRouter(deps.postController, authMw));

  return router;
}
