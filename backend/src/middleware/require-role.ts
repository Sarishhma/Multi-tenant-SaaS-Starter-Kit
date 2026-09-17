import type { FastifyReply, FastifyRequest } from "fastify";
import { forbidden } from "../utils/app-error.js";

 export function requireRole(...allowedRoles: Array<"USER" | "ADMIN">){

    return async function (request: FastifyRequest,reply: FastifyReply){
        if(!request.user){
            throw forbidden("You do not have permission to access this resource");
        }
        if(!allowedRoles.includes(request.user.role)){
            throw forbidden("You donot have the permission to access this resource")
        }
    }

 }