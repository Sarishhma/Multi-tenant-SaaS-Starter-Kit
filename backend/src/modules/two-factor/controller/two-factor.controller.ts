import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorized } from "../../../utils/app-error.js";
import { twoFactorService } from "../services/two-factor.service.js";
import { completeTwoFactorLogin } from "../../auth/services/auth.service.js";
import type { CompleteTwoFactorLoginInput } from "../schemas/two-factor.schema.js";

export const twoFactorController = {
  async setup(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      throw unauthorized("Unauthorized");
    }

    const result = await twoFactorService.generateSetup(
      request.user.sub,
      request.user.email
    );

    return reply.status(200).send(result);
  },

  async verify(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      throw unauthorized("Unauthorized");
    }

    const { code } = request.body as { code: string };

    const result = await twoFactorService.verifySetup(
      request.user.sub,
      code
    );

    return reply.status(200).send(result);
  },

  async completeLogin(
    request: FastifyRequest<{ Body: CompleteTwoFactorLoginInput }>,
    reply: FastifyReply
  ) {
    const { challengeToken, code } = request.body;
    const userAgent = request.headers["user-agent"];
    const ipAddress = request.ip;

    const result = await completeTwoFactorLogin(
      challengeToken,
      code,
      userAgent,
      ipAddress
    );

    // Set the real auth cookies now that 2FA is confirmed
    reply.setCookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60,
    });

    reply.setCookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.status(200).send({ user: result.user });
  },
};
