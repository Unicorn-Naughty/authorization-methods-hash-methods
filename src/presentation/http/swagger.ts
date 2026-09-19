import type swaggerJsdoc from "swagger-jsdoc";

export const swaggerOptions: swaggerJsdoc.OAS3Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "learn",
      version: "1.0.0",
      description:
        "HTTPS API. JWT access token in the body, refresh token in an HttpOnly cookie. OAuth via VK, GitHub, Google (PKCE). Posts with page pagination.",
    },
    servers: [{ url: "https://localhost:3000" }],
    tags: [
      { name: "Auth", description: "Email login, refresh, logout, OAuth" },
      { name: "Posts", description: "Create, read, update, delete posts" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Credentials: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", minLength: 10, maxLength: 50, example: "correcthorse" },
          },
        },
        OAuthProvider: {
          type: "string",
          enum: ["vk", "github", "google"],
        },
        User: {
          type: "object",
          required: ["id", "email"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
          },
        },
        AuthResponse: {
          type: "object",
          required: ["accessToken", "user"],
          properties: {
            accessToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        AccessTokenResponse: {
          type: "object",
          required: ["accessToken"],
          properties: {
            accessToken: { type: "string" },
          },
        },
        CreatePost: {
          type: "object",
          required: ["title", "text"],
          properties: {
            title: { type: "string", minLength: 5, maxLength: 100, example: "Hello world post" },
            text: {
              type: "string",
              minLength: 90,
              maxLength: 1000,
              example:
                "This is a long enough post body for the create endpoint. It needs at least ninety characters so the validation schema accepts it.",
            },
          },
        },
        UpdatePost: {
          type: "object",
          minProperties: 1,
          properties: {
            title: { type: "string", minLength: 5, maxLength: 100 },
            text: { type: "string", minLength: 90, maxLength: 1000 },
          },
        },
        Post: {
          type: "object",
          required: ["id", "title", "text", "created_at", "updated_at", "user_id"],
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            text: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            user_id: { type: "string", format: "uuid" },
          },
        },
        PaginatedPosts: {
          type: "object",
          required: ["items", "page", "limit", "total", "pages"],
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/Post" },
            },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 42 },
            pages: { type: "integer", example: 3 },
          },
        },
        ErrorMessage: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Unauthorized" },
            details: {
              type: "array",
              items: {
                type: "object",
                required: ["path", "message"],
                properties: {
                  path: { type: "string", example: "body.email" },
                  message: { type: "string", example: "Invalid email" },
                },
              },
            },
          },
        },
        ValidationError: {
          type: "object",
          required: ["message", "details"],
          properties: {
            message: { type: "string", example: "validation error" },
            details: {
              type: "array",
              items: {
                type: "object",
                required: ["path", "message"],
                properties: {
                  path: { type: "string", example: "body.email" },
                  message: { type: "string", example: "Invalid email" },
                },
              },
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorMessage" },
            },
          },
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorMessage" },
            },
          },
        },
        NotFound: {
          description: "Not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorMessage" },
            },
          },
        },
        RateLimited: {
          description: "Too many requests",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorMessage" },
            },
          },
        },
        NoContent: {
          description: "No content",
        },
      },
    },
  },
  apis: ["src/presentation/routes/*.ts"],
};
