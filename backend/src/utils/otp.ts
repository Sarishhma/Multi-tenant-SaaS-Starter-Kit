import { createHash, randomInt } from "crypto";
import { env } from "../config/env.js";

export  function generateOtp():string{
    const min= 10 ** (env.OTP_LENGTH -1)
    const max = 10
     ** env.OTP_LENGTH -1 ;
    const code  = randomInt(min,max + 1);
    return code.toString().padStart(env.OTP_LENGTH,"0");
}
export  function hashOtp(otp:string):string{
return  createHash("sha256").update(otp).digest("hex")
}
export  function verifyOtpHash(otp:string,storedHash:string):boolean{
    const computedhash = hashOtp(otp)
    return computedhash===storedHash
}
export function getOtpExpiry():Date{
    return new Date (Date.now()+env.OTP_EXPIRES_IN_MINUTES * 60 *1000)
}
export function isOtpExpired(expiresAt:Date):boolean{
    return new Date ()>expiresAt
}