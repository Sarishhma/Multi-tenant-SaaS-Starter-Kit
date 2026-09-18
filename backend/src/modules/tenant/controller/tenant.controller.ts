import type { FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../service/tenant.service.js";
import type { 
  CreateTenantInput, 
  SwitchTenantInput, 
  InviteTenantInput, 
  AcceptTenantInvitationInput 
} from "../schema/tenant.schema.js";

export class TenantController {
  private tenantService: TenantService;

  constructor(prisma: any) {
    this.tenantService = new TenantService(prisma);
  }

  createTenant = async (
    request: FastifyRequest<{ Body: CreateTenantInput }>, 
    reply: FastifyReply
  ) => {
    const userId = request.user!.sub;
    const sessionId = request.user!.sessionId || "";

    const tenant = await this.tenantService.createTenant(userId, sessionId, request.body);
    return reply.status(201).send(tenant);
  };

  switchTenant = async (
    request: FastifyRequest<{ Body: SwitchTenantInput }>, 
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user!.sub;
      const sessionId = request.user!.sessionId || "";

      const activeTenant = await this.tenantService.switchTenant(
        userId,
        sessionId,
        request.body.tenantId
      );

      const newAccessToken = request.server.jwt.sign(
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
  };

  inviteUser = async (
    request: FastifyRequest<{ Params: { tenantId: string }; Body: InviteTenantInput }>, 
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user!.sub;
      const { tenantId } = request.params;

      const invitation = await this.tenantService.inviteUser(userId, tenantId, request.body);

      return reply.status(200).send({
        message: "Invitation generated successfully.",
        invitationId: invitation.invitationId,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        rawToken: invitation.rawToken,
      });
    } catch (error: any) {
      if (error.message?.startsWith("ACCESS_DENIED")) {
        return reply.status(403).send({ error: error.message });
      }
      return reply.status(400).send({ error: error.message });
    }
  };

  acceptInvitation = async (
    request: FastifyRequest<{ Body: AcceptTenantInvitationInput }>, 
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user!.sub;
      const sessionId = request.user!.sessionId || "";
      const { token } = request.body;

      const result = await this.tenantService.acceptInvitation(userId, sessionId, token);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  };
}