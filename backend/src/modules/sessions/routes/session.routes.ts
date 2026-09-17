import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getSessionsHandler,
  revokeSessionHandler,
} from "../controllers/session.controller.js";
import { authGuard } from "../../../middleware/authGuard.js";
import {
  getSessionsResponseSchema,
  sessionParamsSchema,
  sessionRevokeResponseSchema,
} from "../schema/session.schema.js";
import { errorResponseSchema } from "../../../common/common.schema.js";

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get all active sessions for the logged-in user
  app.get(
    "/sessions",
    {
      schema: {
        tags: ["Sessions"],
        summary: "Get active sessions",
        description:
          "Retrieves all currently active login sessions and devices for the authenticated user.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        response: {
          200: getSessionsResponseSchema,
          401: errorResponseSchema,
        },
      },
      preHandler: authGuard,
    },
    getSessionsHandler
  );

  // Revoke one specific session
  app.delete(
    "/sessions/:sessionId",
    {
      schema: {
        tags: ["Sessions"],
        summary: "Revoke session",
        description:
          "Revokes a specific active session by its sessionId, logging out that specific device.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        params: sessionParamsSchema,
        response: {
          200: sessionRevokeResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
      preHandler: authGuard,
    },
    revokeSessionHandler
  );
};