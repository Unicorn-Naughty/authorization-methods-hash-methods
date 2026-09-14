import { Router } from "express";
import { AuthController } from "../controllers/auth-controller";
import { credentialsRules } from "../http/schemas";
import { validate } from "../middlewares/validate";
import { loginLimiter, refreshLimiter, regLimiter } from "../middlewares/rate-limit";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Credentials'
   *     responses:
   *       201:
   *         description: Created. Access token in body, refresh token in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Path=/auth, Max-Age=7 days.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Validation error or user already exists
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ValidationError'
   *                 - $ref: '#/components/schemas/ErrorMessage'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.post("/register", regLimiter, validate({ body: credentialsRules }), controller.register);

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Credentials'
   *     responses:
   *       201:
   *         description: Logged in. Access token in body, refresh token in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Path=/auth, Max-Age=7 days.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.post("/login", loginLimiter, validate({ body: credentialsRules }), controller.login);

  /**
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh tokens
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshBody'
   *     responses:
   *       201:
   *         description: New access token. Refresh token rotated in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Path=/auth, Max-Age=7 days.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AccessTokenResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.post("/refresh", refreshLimiter, controller.refresh);

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Logout
   *     parameters:
   *       - in: cookie
   *         name: refreshToken
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         $ref: '#/components/responses/NoContent'
   */
  router.post("/logout", controller.logout);

  return router;
}
