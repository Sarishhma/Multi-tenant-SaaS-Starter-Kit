// import fp from "fastify-plugin";
// import rateLimit from "@fastify/rate-limit";
// import type { FastifyPluginAsync } from "fastify";
// import { env } from "../config/env.js";
// export const  rateLimitPlugin:FastifyPluginAsync = fp(async(fastify)=>{
// await fastify.register(rateLimit,{
//     max:env.RATE_LIMIT_MAX,
//     timeWindow:env.RATE_LIMIT_WINDOW,
//     global: true,
// })
// })
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";

export const rateLimitPlugin: FastifyPluginAsync = fp(async (fastify) => {
  console.log("→ Registering rate limit plugin...");
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    global: true,
  });
  console.log("→ Rate limit plugin registered successfully");
});