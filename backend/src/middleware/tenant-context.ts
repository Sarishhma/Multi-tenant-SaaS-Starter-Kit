import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "../generated/prisma/client.js";

export function createTenantContextHook(prisma: PrismaClient) {
  return async function resolveTenantContext(request: FastifyRequest, reply: FastifyReply) {
    // 1. Ensure user is authenticated first
    if (!request.user) {
      return reply.status(401).send({ message: "Unauthenticated" });
    }

    const userId = request.user.sub;

    // 2. Extract tenant ID sources
    const headerTenantId = request.headers["x-tenant-id"] as string | undefined;
    const paramsTenantId = (request.params as { tenantId?: string })?.tenantId;
    const userActiveTenantId = request.user.activeTenantId; // Declared BEFORE use

    // Priority resolution: Header -> Params -> Session Token Claim
    const targetTenantId = headerTenantId || paramsTenantId || userActiveTenantId;

    if (!targetTenantId) {
      return reply.status(400).send({
        message: "Tenant context missing. Provide X-Tenant-ID header or switch to an active workspace.",
      });
    }

    // 3. Verify membership and retrieve role in ONE query
    const membership = await prisma.tenantMember.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: targetTenantId,
        },
      },
      select: {
        tenantId: true,
        role: true,
      },
    });

    // 4. Deny access if user is not a member of this workspace (BOLA / IDOR protection)
    if (!membership) {
      return reply.status(403).send({
        message: "Access denied: You are not a member of this workspace.",
      });
    }

    // 5. Attach validated context to request
    request.tenantContext = {
      tenantId: membership.tenantId,
      role: membership.role,
    };
  };
}