// Let's do Google first, step by step:

// Step 1: OAuth package + Google configuration
// Step 2: /auth/google route
// Step 3: Google callback
// Step 4: Get Google profile
// Step 5: Find/create user
// Step 6: Generate your existing JWT + refresh token
// Step 7: Set cookies
// Step 8: Test login
// Step 9: GitHub OAuth


import { randomUUID } from "crypto";
import { conflict } from "../../../utils/app-error.js";
import { hashOtp } from "../../../utils/otp.js";
import {
  signAccessToken,
  signRefreshToken,
  signTwoFactorChallenge,
} from "../../../utils/token.js";


import { finduserByEmail } from "../../auth/repositories/auth.repository.js";

import {
  createRefreshToken,
} from "../../sessions/repositories/session.repository.js";

import { logAuditEvent } from "../../audit/services/audit.service.js";

import type {
  OAuthProvider,
  GoogleUserInfo,
} from "../types/oauth.types.js";
import { createOAuthUser, findUserByProvider } from "../repositories/OAuth.repository.js";

const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

export async function loginWithOAuth(
  provider: OAuthProvider,
  providerUser: GoogleUserInfo,
  userAgent?: string,
  ipAddress?: string
) {
  let user = await findUserByProvider(
    provider,
    providerUser.sub
  );

  // Existing OAuth account
  if (!user) {
    const existingUser = await finduserByEmail(providerUser.email);

    // Don't automatically merge accounts
    if (existingUser) {
      throw conflict(
        "An account with this email already exists. Please log in with your existing account."
      );
    }

    // Create new OAuth account
    user = await createOAuthUser(
      providerUser.email,
      provider,
      providerUser.sub
    );
  }

  // Respect existing application-level 2FA
  if (user.isTwoFactorEnabled) {
    const challengeToken = signTwoFactorChallenge({
      sub: user.id,
      type: "2fa",
    });

    return {
      requiresTwoFactor: true as const,
      challengeToken,
    };
  }

  // Create access token
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // Create refresh token
  const tokenId = randomUUID();
  const sessionId = randomUUID();
  const familyId = randomUUID();

  const refreshToken = signRefreshToken({
    sub: user.id,
    jti: tokenId,
  });

  const refreshTokenHash = hashOtp(refreshToken);

  const refreshExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_MS
  );

  await createRefreshToken(
    tokenId,
    sessionId,
    familyId,
    user.id,
    refreshTokenHash,
    refreshExpiresAt,
    userAgent,
    ipAddress
  );

  await logAuditEvent(
    "LOGIN_SUCCESS",
    user.id,
    ipAddress,
    userAgent
  );

  return {
    requiresTwoFactor: false as const,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}