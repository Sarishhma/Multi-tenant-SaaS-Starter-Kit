import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { googleCallbackHandler } from "../controllers/oauth.controller.js";

export const oauthRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/google/callback",
    {
      schema: {
        tags: ["OAuth"],
        summary: "Google OAuth2 callback",
        description:
          "Handles the redirect from Google OAuth2, exchanges the authorization code for tokens, logs in or registers the user, sets HttpOnly cookies, and redirects to frontend.",
        querystring: z.object({
          code: z.string().optional().describe("Authorization code returned from Google"),
          state: z.string().optional().describe("State token for CSRF validation"),
          error: z.string().optional().describe("Error code if authentication was denied"),
          error_description: z.string().optional().describe("Detailed error description"),
        }),
      },
    },
    googleCallbackHandler
  );
};