import { prisma } from "../../../lib/prisma.js";
import type { OAuthProvider } from "../types/oauth.types.js";

export function findUserByProvider(
  provider: OAuthProvider,
  providerAccountId: string
) {
  return prisma.user.findFirst({
    where: {
      authProvider: provider,
      providerAccountId,
    },
  });
}

export function createOAuthUser(
  email: string,
  provider: OAuthProvider,
  providerAccountId: string
) {
  return prisma.user.create({
    data: {
      email,
      password: null,
      authProvider: provider,
      providerAccountId,
      isEmailVerified: true,
    },
  });
}