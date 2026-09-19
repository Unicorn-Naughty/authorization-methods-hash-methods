import rateLimit from "express-rate-limit";

const common = {
  windowMs: 10 * 60 * 1000,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  ipv6Subnet: 56,
};

export const refreshLimiter = rateLimit({
  ...common,
  limit: 20,
});

export const regLimiter = rateLimit({
  ...common,
  limit: 10,
});

export const loginLimiter = rateLimit({
  ...common,
  limit: 10,
});

export const logoutLimiter = rateLimit({
  ...common,
  limit: 20,
});

export const oauthLoginLimiter = rateLimit({
  ...common,
  limit: 10,
});

export const oauthCallbackLimiter = rateLimit({
  ...common,
  limit: 10,
});
