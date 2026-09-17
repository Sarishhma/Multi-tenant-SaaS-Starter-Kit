import type { AccessTokenPayload } from "../utils/token.ts";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }

  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: FastifyRequest,
        reply?: FastifyReply
      ) => Promise<{
        token: {
          access_token: string;
        };
      }>;
    };
  }
}

//What this actually does: declare module "fastify" tells TypeScript "I want to add extra properties to this 
// existing library's types." We're saying: every FastifyRequest object now optionally has a .user field, typed as your
//  AccessTokenPayload (remember, that's { sub: string; email: string } from token.ts). Without this,
//  writing request.user = ... anywhere would be a TypeScript error — "Property 'user' does not exist on type FastifyRequest."