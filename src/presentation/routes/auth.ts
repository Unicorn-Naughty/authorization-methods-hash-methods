import { Router } from "express";
import { CORS_ORIGINS } from "../../config/config";
import { AuthController } from "../controllers/auth-controller";
import { credentialsRules, oauthCallbackQuery, oauthLoginRules } from "../http/schemas";
import { cookieCsrf } from "../middlewares/csrf";
import { validate } from "../middlewares/validate";
import {
  loginLimiter,
  logoutLimiter,
  oauthCallbackLimiter,
  oauthLoginLimiter,
  refreshLimiter,
  regLimiter,
} from "../middlewares/rate-limit";

export function createAuthRouter(
  controller: AuthController,
  allowedOrigins: string[] = CORS_ORIGINS,
): Router {
  const router = Router();
  const csrf = cookieCsrf(allowedOrigins);

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
   *             description: HttpOnly refreshToken cookie. Secure, SameSite=None, Path=/api/auth, Max-Age=7 days.
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
   *       200:
   *         description: Logged in. Access token in body, refresh token in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Secure, SameSite=None, Path=/api/auth, Max-Age=7 days.
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
   *     parameters:
   *       - in: cookie
   *         name: refreshToken
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: New access token. Refresh token rotated in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Secure, SameSite=None, Path=/api/auth, Max-Age=7 days.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AccessTokenResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.post("/refresh", refreshLimiter, csrf, controller.refresh);

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
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.post("/logout", logoutLimiter, csrf, controller.logout);

  /**
   * @openapi
   * /api/auth/oauth/login:
   *   get:
   *     tags: [Auth]
   *     summary: Start OAuth
   *     parameters:
   *       - in: query
   *         name: provider
   *         required: true
   *         description: vk, github or google
   *         schema:
   *           $ref: '#/components/schemas/OAuthProvider'
   *     responses:
   *       302:
   *         description: Redirect to the provider authorize URL
   *         headers:
   *           Location:
   *             schema:
   *               type: string
   *               format: uri
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.get(
    "/oauth/login",
    oauthLoginLimiter,
    validate({ query: oauthLoginRules }),
    controller.oauthLogin,
  );

  /**
   * @openapi
   * /api/auth/oauth/callback:
   *   get:
   *     tags: [Auth]
   *     summary: OAuth callback
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *       - in: query
   *         name: device_id
   *         description: Required for VK
   *         schema:
   *           type: string
   *       - in: query
   *         name: payload
   *         description: VK payload JSON with code, state, device_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: error
   *         schema:
   *           type: string
   *       - in: query
   *         name: error_description
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Logged in. Access token in body, refresh token in Set-Cookie.
   *         headers:
   *           Set-Cookie:
   *             schema:
   *               type: string
   *             description: HttpOnly refreshToken cookie. Secure, SameSite=None, Path=/api/auth, Max-Age=7 days.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Invalid callback, missing or unverified email
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ValidationError'
   *                 - $ref: '#/components/schemas/ErrorMessage'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       429:
   *         $ref: '#/components/responses/RateLimited'
   */
  router.get(
    "/oauth/callback",
    oauthCallbackLimiter,
    validate({ query: oauthCallbackQuery }),
    controller.oauthCallback,
  );

  return router;
}
