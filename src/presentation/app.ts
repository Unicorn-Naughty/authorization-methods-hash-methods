import express, { type Express } from "express";

import { PrismaPostRepository, PrismaUserRepository } from "../infrastructure/db/repositories";
import { AuthService, PostService } from "../domain/services";
import { BcryptHashService } from "../infrastructure/services/hash";
import { TokenService } from "../infrastructure/services/token";
import { AuthController } from "./controllers";
import { PostController } from "./controllers/post-controller";
import { errorMiddleware } from "./middlewares/error-middlware";
import { createRoutes } from "./routes";
import { redis } from "../infrastructure/db/redis.client";
import { db } from "../infrastructure/db/prisma.client";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./http/swagger";

export async function createApp(): Promise<Express> {
  if (!redis.isOpen) {
    await redis.connect();
  }
  await db.$connect();

  const app = express();

  const userRepo = new PrismaUserRepository();
  const postRepo = new PrismaPostRepository();
  const hashService = new BcryptHashService();
  const tokenService = new TokenService(redis);

  const authService = new AuthService(hashService, tokenService, userRepo);
  const postService = new PostService(postRepo);

  const authController = new AuthController(authService);
  const postController = new PostController(postService);

  const routes = createRoutes({ authController, postController, tokenService });

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src": ["'self'", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
        },
      },
    }),
  );
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use("/api", routes);

  const spec = swaggerJsdoc(swaggerOptions);
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.use(errorMiddleware);

  return app;
}
