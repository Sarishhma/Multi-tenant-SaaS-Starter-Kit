import { z } from "zod";


export const sessionParamsSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

export const sessionItemSchema = z.object({
  id: z.string().describe("Session ID"),
  userAgent: z.string().nullable().describe("Browser or client User-Agent"),
  ipAddress: z.string().nullable().describe("Client IP address"),
  createdAt: z.coerce.date().describe("Session creation timestamp"),
  lastUsedAt: z.coerce.date().describe("Timestamp of last session activity"),
});

export const getSessionsResponseSchema = z.object({
  sessions: z.array(sessionItemSchema).describe("List of active sessions for the user"),
});

export const sessionRevokeResponseSchema = z.object({
  message: z.string(),
});

export type sessionParamsInput = z.infer<typeof sessionParamsSchema>;
export type SessionItem = z.infer<typeof sessionItemSchema>;