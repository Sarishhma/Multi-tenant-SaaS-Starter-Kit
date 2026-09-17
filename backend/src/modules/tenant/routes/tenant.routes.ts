import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authGuard } from "../../../middleware/authGuard.js"; // Adjust import path if needed
import {
  createTenantSchema,
  tenantResponseSchema,
  switchTenantSchema,
  switchTenantResponseSchema,
} from "../schema/tenant.schema.js";
import { errorResponseSchema } from "../../../common/common.schema.js";
import { TenantService } from "../service/tenant.service.js";

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const tenantService = new TenantService(fastify.prisma);

  // 1. Provision a new Tenant Workspace
  app.post(
    "/tenants",
    {
      schema: {
        tags: ["Tenants"],
        summary: "Provision a new workspace (Atomic Onboarding)",
        description: "Creates a new tenant workspace, assigns creator as OWNER, and logs audit event.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        body: createTenantSchema,
        response: {
          201: tenantResponseSchema,
          401: errorResponseSchema,
        },
      },
      preHandler: authGuard,
    },
    async (request, reply) => {
      const userId = request.user!.sub;
      const sessionId = request.user!.sessionId || "";

      const tenant = await tenantService.createTenant(userId, sessionId, request.body);
      return reply.status(201).send(tenant);
    }
  );

  // 2. Switch Active Workspace Context & Re-issue JWT
  app.post(
    "/tenants/switch",
    {
      schema: {
        tags: ["Tenants"],
        summary: "Switch active tenant workspace and update session state",
        description: "Updates activeTenantId on session and returns a new access token with updated tenant claims.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        body: switchTenantSchema,
        response: {
          200: switchTenantResponseSchema,
          403: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
      preHandler: authGuard,
    },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const sessionId = request.user!.sessionId || "";

        const activeTenant = await tenantService.switchTenant(
          userId,
          sessionId,
          request.body
        );

        // Sign new JWT carrying fresh active workspace claims
        const newAccessToken = fastify.jwt.sign(
          {
            sub: userId,
            email: request.user!.email,
            role: request.user!.role,
            sessionId,
            activeTenantId: activeTenant.id,
            tenantRole: activeTenant.role,
          },
          { expiresIn: "15m" }
        );

        return reply.status(200).send({
          message: "Workspace switched successfully",
          accessToken: newAccessToken,
          activeTenant,
        });
      } catch (error: any) {
        if (error.message?.startsWith("ACCESS_DENIED")) {
          return reply.status(403).send({ error: error.message });
        }
        throw error;
      }
    }
  );
};