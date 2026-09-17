import type { FastifyReply, FastifyRequest } from "fastify";

import { getAuditLogs } from "../services/audit.service.js";
import { type AuditLogQueryInput, auditLogQuerySchema } from "../schema/audit.schema.js";

export async function getAuditLogsController(
    request: FastifyRequest<{ Querystring: AuditLogQueryInput }>,
    reply: FastifyReply
) {
    const query = request.query;

    const result = await getAuditLogs(
        query.page,
        query.limit,
        query.eventType,
        query.userId
    );

    return reply.status(200).send(result);
}