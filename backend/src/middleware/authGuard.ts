import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/token.js";
import { unauthorized } from "../utils/app-error.js";

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const token =request.cookies.accessToken;

if(!token){
  throw unauthorized("Missing or invalide access Token")
}
  try {
    const decoded = verifyAccessToken(token);
    request.user = decoded;
  } catch {
    throw unauthorized("Invalid or expired access token");
  }
}