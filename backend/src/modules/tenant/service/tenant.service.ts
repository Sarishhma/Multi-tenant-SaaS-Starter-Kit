import type { CreateTenantInput } from "../schema/tenant.schema.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import slugify from "slugify";


export class TenantService {
  constructor(private prisma: PrismaClient) {}

//   Instead of hardcoding const prisma = new PrismaClient() inside the service, we pass PrismaClient 
//   into the constructor. 
//   This makes testing easy because we can mock the database in unit tests without touching a real database.

  /**
   * Generates a unique, URL-safe slug for a workspace.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    let slug = baseSlug;
    let count = 1;

    // Check collision
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  /**
   * Provision a new workspace atomically.
   */
  async createTenant(userId: string, sessionId: string, input: CreateTenantInput) {
    const slug = await this.generateUniqueSlug(input.name);

    // Atomic Execution Block
    const [tenant, member] = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug,
          createdById: userId,
        },
      });

      // 2. Add creator as OWNER in TenantMember
      const newMember = await tx.tenantMember.create({
        data: {
          userId,
          tenantId: newTenant.id,
          role: 'OWNER',
        },
      });

      // 3. Bind active workspace context to active session
      await tx.refreshToken.updateMany({
        where: { sessionId, userId, revokedAt: null },
        data: { activeTenantId: newTenant.id },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          tenantId: newTenant.id,
          eventType: 'TENANT_CREATED',
          metadata: { workspaceName: newTenant.name, slug: newTenant.slug },
        },
      });

      return [newTenant, newMember];
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      role: member.role,
      createdAt: tenant.createdAt,
    };
  }
  async switchTenant(
    userId: string,
    sessionId: string,
    body: { tenantId: string }
  ) {
    const { tenantId } = body;

    // 1. Verify user is a member of the target tenant workspace
    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        userId_tenantId: {
          tenantId,
          userId,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new Error("ACCESS_DENIED: You are not a member of this workspace.");
    }

    // 2. Update active tenant on current user session (if session tracking is enabled)
    if (sessionId) {
      await this.prisma.refreshToken.update({
        where: { id: sessionId },
        data: { activeTenantId: tenantId },
      });
    }

    return {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      role: membership.role,
    };
  }
}