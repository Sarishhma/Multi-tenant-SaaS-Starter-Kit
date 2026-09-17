import {
    findActiveSessionsForUser,
    findSessionByIdAndUser,
    revokeSession as revokeSessionRepository,
} from "../repositories/session.repository.js";

import { notFound } from "../../../utils/app-error.js";
import { prisma } from "../../../lib/prisma.js";

// Session ID identifies a particular login/device, while refresh tokens are the credentials that keep that session authenticated. This allows users to revoke one device without logging out their other devices.
export async function getUserSessions(userId: string) {
    const sessions = await findActiveSessionsForUser(userId);

    return sessions.map((session) => ({
        id: session.sessionId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
    }));
}


export async function revokeSession(
    sessionId: string,
    userId: string
) {
    const session = await findSessionByIdAndUser(
        sessionId,
        userId
    );

    if (!session) {
        throw notFound("Session not found");
    }

    await revokeSessionRepository(session.sessionId,userId);

    return {
        message: "Session revoked successfully",
    };
}

export function revokeSessionFamily(sessionId: string) {
  return prisma.refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}