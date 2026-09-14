import { RequestHandler, Router } from "express";
import { PostController } from "../controllers/post-controller";
import { createRules, idParams, updateRules } from "../http/schemas";
import { validate } from "../middlewares/validate";

export function createPostRouter(controller: PostController, mw: RequestHandler): Router {
  const router = Router();

  /**
   * @openapi
   * /api/posts:
   *   post:
   *     tags: [Posts]
   *     summary: Create post
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePost'
   *     responses:
   *       201:
   *         description: Created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post("/", mw, validate({ body: createRules }), controller.create);

  /**
   * @openapi
   * /api/posts/{id}:
   *   delete:
   *     tags: [Posts]
   *     summary: Delete post
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         $ref: '#/components/responses/NoContent'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete("/:id", mw, validate({ params: idParams }), controller.delete);

  /**
   * @openapi
   * /api/posts/{id}:
   *   patch:
   *     tags: [Posts]
   *     summary: Update post
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePost'
   *     responses:
   *       200:
   *         description: Updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch("/:id", mw, validate({ body: updateRules, params: idParams }), controller.update);

  /**
   * @openapi
   * /api/posts:
   *   get:
   *     tags: [Posts]
   *     summary: List posts
   *     responses:
   *       200:
   *         description: All posts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Post'
   */
  router.get("/", controller.findAll);

  /**
   * @openapi
   * /api/posts/{id}:
   *   get:
   *     tags: [Posts]
   *     summary: Get post
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Post, or null if missing
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/Post'
   *               nullable: true
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   */
  router.get("/:id", validate({ params: idParams }), controller.findOne);

  return router;
}
