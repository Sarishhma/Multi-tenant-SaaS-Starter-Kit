import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";

export const swaggerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Tell Fastify to use Zod for validating requests and serializing responses
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Sarishma's Backend API",
        description: "API documentation",
        version: "1.0.0",
      },
      servers: [
        { url: "http://127.0.0.1:3000", description: "Development server" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "accessToken",
          },
        },
      },
      tags: [
        { name: "Authentication", description: "Authentication endpoints" },
        { name: "OAuth", description: "OAuth2 social authentication endpoints" },
        { name: "Two-Factor Authentication", description: "Two-factor authentication endpoints" },
        { name: "Sessions", description: "Session management endpoints" },
        { name: "Audit Logs", description: "Audit log and event tracking endpoints" },
        { name: "Health", description: "Health check endpoint" },
      ],
    },
    transform: jsonSchemaTransform, // <-- converts Zod schemas into OpenAPI schemas
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
  });
});