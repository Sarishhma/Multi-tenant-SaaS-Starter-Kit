import type { Prisma } from "../../../generated/prisma/client.js";
import { AuditEventType } from "../../../generated/prisma/enums.js";

import { prisma } from "../../../lib/prisma.js";

export function createAuditLog(
    eventType: AuditEventType,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Prisma.InputJsonValue
) {
    return prisma.auditLog.create({
        data: {
            eventType,
            userId,
            ipAddress,
            userAgent,
            metadata,
        },
    });
}

export function findAuditLogs(
    page: number,
    limit: number,
    eventType?: AuditEventType,
    userId?: string
) {
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
        ...(eventType && { eventType }),
        ...(userId && { userId }),
    };

    return Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),

        prisma.auditLog.count({
            where,
        }),
    ]);
}