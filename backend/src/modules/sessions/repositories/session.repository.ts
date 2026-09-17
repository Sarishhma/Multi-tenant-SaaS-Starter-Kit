import { prisma } from "../../../lib/prisma.js";

// Create a new session / refresh token
export function createRefreshToken(
    id: string,
    sessionId: string,
    familyId:string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string
) {
    return prisma.refreshToken.create({
        data: {
            id,
            sessionId,
            familyId,
            userId,
            tokenHash,
            expiresAt,
            userAgent,
            ipAddress,
        },
    });
}

// Find refresh token by its ID
export function findRefreshTokenById(id: string) {
    return prisma.refreshToken.findUnique({
        where: {
            id,
        },
    });
}

// Find refresh token belonging to a specific user
export function findRefreshTokenByIdAndUser(
    id: string,
    userId: string
) {
    return prisma.refreshToken.findFirst({
        where: {
            id,
            userId,
        },
    });
}

export function findSessionByIdAndUser(
    sessionId: string,
    userId: string
) {
    return prisma.refreshToken.findFirst({
        where: {
            sessionId,
            userId,
            revokedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
    });
}

// Get active sessions for a user
export function findActiveSessionsForUser(userId: string) {
    return prisma.refreshToken.findMany({
        where: {
            userId,
            revokedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
        orderBy: {
            lastUsedAt: "desc",
        },
    });
}

// Revoke one refresh token
export function revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
        where: {
            id,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

// Revoke all sessions belonging to a user
export function revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
        where: {
            userId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

export function revokeTokenFamily(familyId: string) {
    return prisma.refreshToken.updateMany({
        where: {
            familyId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

// Update session activity
export function touchRefreshToken(id: string) {
    return prisma.refreshToken.update({
        where: {
            id,
        },
        data: {
            lastUsedAt: new Date(),
        },
    });
}

export function revokeSession(
    sessionId: string,
    userId: string
) {
    return prisma.refreshToken.updateMany({
        where: {
            sessionId,
            userId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

export function consumeRefreshToken(id: string, 
    replacedBy:string,
  replacementTokenEncrypted: string
) {
    return prisma.refreshToken.updateMany({
        where: {
            id,
            revokedAt: null,
            
        },
        data: {
            revokedAt: new Date(),
            replacedAt: new Date(),
            replacedBy,
            replacementTokenEncrypted
        },
    });
}
