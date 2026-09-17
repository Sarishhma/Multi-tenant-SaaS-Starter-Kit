import fp from "fastify-plugin"
import cors from "@fastify/cors"
import type { FastifyPluginAsync } from "fastify"
import { env } from "../config/env.js"

export const corsPlugins: FastifyPluginAsync=fp(async(fastify)=>{
   
// fp(...) is basically saying: "hey Fastify, don't put this in its own separate room with its own door — treat it 
// as if it's built into the walls of the ENTIRE house, visible and active everywhere, no matter which room someone's standing in."
    
    await fastify.register(cors,{
        origin:env.FRONTEND_ORIGIN,
        credentials:true,
        // this is required specifically because your refresh-token flow will eventually need to send cookies or auth headers
        //  across origins (frontend calling backend). Without this flag, even if the origin is allowed, 
        // credentialed requests get silently blocked.
    })
})