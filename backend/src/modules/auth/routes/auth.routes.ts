import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  loginResponseSchema,
  refreshResponseSchema,
  meResponseSchema,
} from "../schemas/auth.schema.js";

import {
  forgotPasswordhandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerhandler,
  resendOtpHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "../controllers/auth.controller.js";
import { authGuard } from "../../../middleware/authGuard.js";
import { requireRole } from "../../../middleware/require-role.js";
import { errorResponseSchema, messageResponseSchema } from "../../../common/common.schema.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

 app.get(
  "/me",
  {
    schema: {
      tags: ["Authentication"],
      summary: "Get current authenticated user",
      security: [{ bearerAuth: [] }],
      response: {
        200: meResponseSchema,
        401: errorResponseSchema,
      },
    },
    preHandler: authGuard,
  },
  async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    return reply.status(200).send({ user: request.user });
  },
);

  app.get(
    "/admin-only",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Admin-only test route",
        description: "Sample route restricted to users with the ADMIN role.",
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({ message: z.string(), user: z.any() }),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
      preHandler: [authGuard, requireRole("ADMIN")],
    },
    async (request, reply) => {
      return reply.status(200).send({ message: "Welcome admin!", user: request.user });
    },
  );

  app.post(
    "/register",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Creates a new user account and triggers OTP-based email verification.",
        body: registerSchema,
        response: {
          201: messageResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    registerhandler,
  );

  app.post(
    "/resend-otp",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Resend verification OTP",
        body: resendOtpSchema,
        response: {
          200: messageResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    resendOtpHandler,
  );

  app.post(
    "/verify-email",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Verify email with OTP",
        body: verifyEmailSchema,
        response: {
          200: messageResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    verifyEmailHandler,
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Login with email and password",
        description:
          "Authenticates user credentials and sets HttpOnly cookies. If 2FA is enabled, returns challengeToken for /api/two-factors/complete-login.",
        body: loginSchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    loginHandler,
  );

  app.post(
    "/refresh",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description:
          "Exchanges the valid HttpOnly refresh token cookie for a new access + refresh token pair (rotation).",
        security: [{ cookieAuth: [] }],
        body: refreshTokenSchema.optional(),
        response: {
          200: refreshResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    refreshHandler,
  );

  app.post(
    "/log-out",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Logout",
        description: "Revokes the active refresh token session and clears HttpOnly auth cookies.",
        security: [{ cookieAuth: [] }],
        body: logoutSchema.optional(),
        response: {
          200: messageResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    logoutHandler,
  );

  app.post(
    "/forgot-password",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Request password reset",
        body: forgotPasswordSchema,
        response: {
          200: messageResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    forgotPasswordhandler,
  );

  app.post(
    "/reset-password",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Reset password with OTP",
        body: resetPasswordSchema,
        response: {
          200: messageResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    resetPasswordHandler,
  );
};