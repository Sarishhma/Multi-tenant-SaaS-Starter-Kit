import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authGuard } from "../../../middleware/authGuard.js";
import { TenantController } from "../controller/tenant.controller.js";
import {
  createTenantSchema,
  tenantResponseSchema,
  switchTenantSchema,
  switchTenantResponseSchema,
  inviteTenantSchema,
  inviteTenantResponseSchema,
  acceptTenantInvitationSchema,
  acceptTenantInvitationResponseSchema,
} from "../schema/tenant.schema.js";
import { errorResponseSchema } from "../../../common/common.schema.js";

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const tenantController = new TenantController(fastify.prisma);

  app.post("/tenants", {
    schema: {
      tags: ["Tenants"],
      summary: "Provision a new workspace",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: createTenantSchema,
      response: { 201: tenantResponseSchema, 401: errorResponseSchema },
    },
    preHandler: authGuard,
  }, tenantController.createTenant);

  app.post("/tenants/switch", {
    schema: {
      tags: ["Tenants"],
      summary: "Switch active workspace",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: switchTenantSchema,
      response: { 200: switchTenantResponseSchema, 403: errorResponseSchema, 401: errorResponseSchema },
    },
    preHandler: authGuard,
  }, tenantController.switchTenant);

  app.post("/tenants/:tenantId/invite", {
    schema: {
      tags: ["Tenants"],
      summary: "Invite user to workspace",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      params: z.object({ tenantId: z.string().uuid() }),
      body: inviteTenantSchema,
      response: { 200: inviteTenantResponseSchema, 403: errorResponseSchema, 400: errorResponseSchema },
    },
    preHandler: authGuard,
  }, tenantController.inviteUser);

  app.post("/tenants/invitations/accept", {
    schema: {
      tags: ["Tenants"],
      summary: "Accept workspace invitation",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      body: acceptTenantInvitationSchema,
      response: { 200: acceptTenantInvitationResponseSchema, 400: errorResponseSchema },
    },
    preHandler: authGuard,
  }, tenantController.acceptInvitation);
};