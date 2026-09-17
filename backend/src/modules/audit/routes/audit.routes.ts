import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getAuditLogsController } from "../controllers/audit.controller.js";
import { auditLogQuerySchema, auditLogsResponseSchema } from "../schema/audit.schema.js";
import { errorResponseSchema } from "../../../common/common.schema.js";

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Audit Logs"],
        summary: "Get audit logs",
        description:
          "Retrieves paginated audit log events with optional filtering by event type and user ID.",
        querystring: auditLogQuerySchema,
        response: {
          200: auditLogsResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    getAuditLogsController
  );
};