import { z } from "zod";
import { AuditEventType } from "../../../generated/prisma/enums.js";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe("Items per page (max 100)"),
  eventType: z.nativeEnum(AuditEventType).optional().describe("Filter by audit event type"),
  userId: z.string().optional().describe("Filter by user ID"),
});

export const auditLogItemSchema = z.object({
  id: z.string().describe("Audit log ID"),
  userId: z.string().nullable().describe("User ID associated with the event"),
  eventType: z.nativeEnum(AuditEventType).describe("Type of audit event"),
  ipAddress: z.string().nullable().describe("Client IP address"),
  userAgent: z.string().nullable().describe("Client User-Agent"),
  metadata: z.any().nullable().describe("Additional structured event metadata"),
  createdAt: z.coerce.date().describe("Event creation timestamp"),
});

export const auditLogsResponseSchema = z.object({
  logs: z.array(auditLogItemSchema).describe("List of audit log records"),
  pagination: z.object({
    page: z.number().int().describe("Current page number"),
    limit: z.number().int().describe("Items per page"),
    total: z.number().int().describe("Total number of records"),
    totalPages: z.number().int().describe("Total number of pages"),
  }),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type AuditLogItem = z.infer<typeof auditLogItemSchema>;
export type AuditLogsResponse = z.infer<typeof auditLogsResponseSchema>;