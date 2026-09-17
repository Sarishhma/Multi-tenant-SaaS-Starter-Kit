import fp from "fastify-plugin"
import cookie from "@fastify/cookie"
import  type {FastifyPluginAsync} from "fastify"

export const cookiePlugin: FastifyPluginAsync=fp(async(fastify)=>{
    await fastify.register(cookie)
})

