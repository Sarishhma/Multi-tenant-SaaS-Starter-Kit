import type { PrismaClient, Prisma, TenantRole } from "../../../generated/prisma/client.js";

export class TenantRepository {
  constructor(private prisma: PrismaClient) {}

  async findTenantBySlug(slug: string, db: Prisma.TransactionClient | PrismaClient = this.prisma) {
    return db.tenant.findUnique({ where: { slug } });
  }

  async createTenantWithMemberAndAudit(
    userId: string,
    sessionId: string,
    input: { name: string; slug: string },
    role: TenantRole = 'OWNER'
  ) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          createdById: userId,
        },
      });

      const member = await tx.tenantMember.create({
        data: {
          userId,
          tenantId: tenant.id,
          role,
        },
      });

      await tx.refreshToken.updateMany({
        where: { sessionId, userId, revokedAt: null },
        data: { activeTenantId: tenant.id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          tenantId: tenant.id,
          eventType: 'TENANT_CREATED',
          metadata: { workspaceName: tenant.name, slug: tenant.slug },
        },
      });

      return { tenant, member };
    });
  }

  async findMembership(userId: string, tenantId: string) {
    return this.prisma.tenantMember.findUnique({
      where: { userId_tenantId: { tenantId, userId } },
      include: { tenant: true },
    });
  }

  async updateActiveSession(sessionId: string, tenantId: string) {
    return this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { activeTenantId: tenantId },
    });
  }

  async upsertInvitation(
    tenantId: string,
    email: string,
    role: TenantRole,
    tokenHash: string,
    expiresAt: Date
  ) {
    return this.prisma.tenantInvitation.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: { tokenHash, role, expiresAt },
      create: { email, tenantId, role, tokenHash, expiresAt },
    });
  }

  async findInvitationByHash(tokenHash: string) {
    return this.prisma.tenantInvitation.findUnique({
      where: { tokenHash },
      include: { tenant: true },
    });
  }

  async deleteInvitation(id: string) {
    return this.prisma.tenantInvitation.delete({ where: { id } }).catch(() => {});
  }

  async acceptInvitationTx(
    userId: string,
    sessionId: string,
    tenantId: string,
    role: TenantRole,
    invitationId: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.tenantMember.upsert({
        where: { userId_tenantId: { userId, tenantId } },
        update: { role },
        create: { userId, tenantId, role },
      });

      await tx.tenantInvitation.delete({ where: { id: invitationId } });

      if (sessionId) {
        await tx.refreshToken.updateMany({
          where: { sessionId, userId, revokedAt: null },
          data: { activeTenantId: tenantId },
        });
      }

      return member;
    });
  }
}