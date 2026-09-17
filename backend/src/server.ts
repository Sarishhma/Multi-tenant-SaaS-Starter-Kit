import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app= await buildApp()
//The moment this file runs, it immediately calls buildApp() — this executes everything inside app.ts: creates the Fastify 
// instance, registers all your plugins, registers all your routes. By the time this line finishes, app is a fully assembled 
// (but not yet running) Fastify application
async function start(){
    try{
        await app.listen({port:env.PORT,host:"0.0.0.0"})//0.0.0.0 means "accept connections from any network interface," which is required for real deployments
    }catch(err){
        app.log.error(err)//if, say, your database connection string were wrong, you'd want a clear log of exactly why the server refused to start, rather than it just silently failing.
        process.exit(1)//ny non-zero number (commonly 1) means "something went wrong."
        //code 0 means "everything finished successfully,"
    }
}
start()
async function gracefulShutdown(signal:string){
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();//Fastify's .close() method tells the server: stop accepting BRAND NEW incoming requests, but wait for any requests currently in progress to actually finish before shutting down fully. So if your server was in the middle of writing an OTP to your Neon database when Ctrl+C got pressed, app.close() gives it a chance to finish that one operation cleanly, rather than getting severed mid-write.
    process.exit(0)//once cleanup is done, we THEN actually exit
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));//this is sent when something else (not you pressing a key) wants your program to stop — most commonly, a hosting platform. When you eventually deploy this to Railway/Render and push a new update, or the platform decides to restart/scale your app, it sends SIGTERM to your running process, essentially saying "please wind down, I'm about to shut you off.
process.on("SIGINT", () => gracefulShutdown("SIGINT"));//("signal interrupt") — this is sent when you personally press Ctrl+C in the terminal where your server is running. You're manually telling the OS "interrupt this program," and the OS forwards that as a SIGINT signal to your running Node process.