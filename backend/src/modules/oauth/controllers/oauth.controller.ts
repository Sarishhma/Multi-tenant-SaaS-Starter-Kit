import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../../config/env.js";
import { loginWithOAuth } from "../services/oauth.service.js";
import type { GoogleUserInfo } from "../types/oauth.types.js";

function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
) {
  reply.setCookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: 15 * 60,
  });

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function googleCallbackHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const query = request.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  if (query.error) {
    return reply.redirect(
      `${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(
        query.error_description || query.error
      )}`
    );
  }

  try {
    const {
      token: { access_token },
    } =
      await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request,
        reply
      );

    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!response.ok) {
      return reply.redirect(
        `${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(
          "Unable to get Google account information"
        )}`
      );
    }

    const googleUser = (await response.json()) as GoogleUserInfo;

    if (!googleUser.email || !googleUser.email_verified) {
      return reply.redirect(
        `${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(
          "Google email is not verified"
        )}`
      );
    }

    const result = await loginWithOAuth(
      "GOOGLE",
      googleUser,
      request.headers["user-agent"],
      request.ip
    );

    if (result.requiresTwoFactor) {
      return reply.redirect(
        `${env.FRONTEND_ORIGIN}/login?oauth2fa=true&challengeToken=${result.challengeToken}`
      );
    }

    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken
    );

    return reply.redirect(`${env.FRONTEND_ORIGIN}/`);
  } catch (err: any) {
    const message = err?.message || "Google authentication failed";
    return reply.redirect(
      `${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(message)}`
    );
  }
}