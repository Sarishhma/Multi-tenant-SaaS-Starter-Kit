import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyError } from "fastify";
import { AppError } from "../utils/app-error.js";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

export const errorHandlerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    // Case 1: Zod validation failed (bad request body/params/query)
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: "Validation failed",
        details: error.validation,
      });
    }

    // Case 2: An error WE deliberately threw (business logic rejection)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
      });
    }

    // Case 3: An unexpected error (a real bug, or something outside our control)
    request.log.error(error);
    return reply.status(500).send({
      error: "Something went wrong. Please try again later.",
    });
  });
});