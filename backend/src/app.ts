import Fastify from "fastify";
import { z } from "zod";
import { env } from "./config/env.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { errorHandlerPlugin } from "./plugins/error-handler-plugin.js";
import { corsPlugins } from "./plugins/cors.plugin.js";
import { rateLimitPlugin } from "./plugins/rate-limit-plugin.js";

import { cookiePlugin } from "./plugins/cookie.plugin.js";
import { authRoutes } from "./modules/auth/routes/auth.routes.js";
import { sessionRoutes } from "./modules/sessions/routes/session.routes.js";
import { auditRoutes } from "./modules/audit/routes/audit.routes.js";
import twoFactorRoutes from "./modules/two-factor/routes/two-factor.routes.js";
import { registerGoogleOAuth } from "./config/google-oauth.js";
import { oauthRoutes } from "./modules/oauth/routes/oauth.routes.js";
import { swaggerPlugin } from "./plugins/swagger.plugins.js";

export async function buildApp() {
  //is a function that RETURNS the app, instead of just running it directly here — this is a testability pattern: later, if you write automated tests, you can call buildApp()
  const app = Fastify({
    // this actually creates the real Fastify instance for the first time in this whole project. Everything before this
    //  (authRoutes, the plugins) were just definitions sitting in files, waiting to be plugged into a real app
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } } //in development, pino-pretty makes logs human-readable with colors
        : true, //uses plain JSON logs instead — which is actually the better format for production
  });
  //setValidatorCompiler / setSerializerCompiler — this is the missing piece that actually activates the Zod integration globally. Without these two lines, withTypeProvider<ZodTypeProvider>() in your routes file wouldn't actually know how to use Zod schemas for real validation — this tells Fastify "use Zod's rules to check incoming data, and Zod's rules to shape outgoing responses.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(corsPlugins);
  await app.register(cookiePlugin); // must be registered BEFORE @fastify/oauth2, so oauth2 skips its own internal cookie registration
  await registerGoogleOAuth(app);

  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin)

  await app.register(authRoutes, { prefix: "/api/auth" }); //That prefix option means /register inside auth.routes.ts actually becomes reachable at /api/auth/register — keeping your URL structure organized and namespaced
  await app.register(sessionRoutes, { prefix: "/api" });
  await app.register(auditRoutes, { prefix: "/api/audit-logs" });
  await app.register(oauthRoutes, { prefix: "/api/auth" });
  await app.register(twoFactorRoutes, { prefix: "/api/two-factors" });
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        description: "Checks if the server is running and responsive.",
        response: {
          200: z.object({ status: z.string() }),
        },
      },
    },
    async () => {
      //This exists purely so you (or a deployment platform like Railway/Vercel later) can quickly check "is the server even running at all," separate from checking whether your actual business logic works
      return { status: "ok" };
    }
  );

  return app;
}
