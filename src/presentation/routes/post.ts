import { RequestHandler, Router } from "express";
import { PostController } from "../controllers/post-controller";

export function createPostRouter(controller: PostController, mw: RequestHandler): Router {
  const router = Router();
  router.post("/", mw, controller.create);
  router.delete("/:id", mw, controller.delete);
  router.patch("/:id", mw, controller.update);
  router.get("/", controller.findAll);
  router.get("/:id", controller.findOne);
  return router;
}
