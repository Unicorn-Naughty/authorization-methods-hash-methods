import express from "express"

import { PrismaPostRepository, PrismaUserRepository } from "../infrastructure/db/repositories";
import { AuthService, PostService } from "../domain/services";
import { BcryptHashService } from "../infrastructure/services/hash";
import { TokenService } from "../infrastructure/services/token";
import { AuthController } from "./controllers";
import { PostController } from "./controllers/post-controller";
import { errorMiddleware } from "./middlewares/error-middlware";
import { createRoutes } from "./routes";
import { redis } from "../infrastructure/db/redis.client";

const app = express()


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
app.use("/api", routes);
app.use(errorMiddleware);

export default app;