import type { AuditEventType } from "../../../generated/prisma/enums.js";
import type { Prisma } from "../../../generated/prisma/client.js";

import {
    createAuditLog,
    findAuditLogs,
} from "../repositories/audit.repository.js";

export function logAuditEvent(
    eventType: AuditEventType,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Prisma.InputJsonValue
) {
    createAuditLog(
        eventType,
        userId,
        ipAddress,
        userAgent,
        metadata
    ).catch((err) => {
        console.log("Failed to write audit log", err);
    });
}

export async function getAuditLogs(
    page: number,
    limit: number,
    eventType?: AuditEventType,
    userId?: string
) {
    const [logs, total] = await findAuditLogs(
        page,
        limit,
        eventType,
        userId
    );

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}