import  jwt,{type SignOptions}  from "jsonwebtoken";
import { env } from "../config/env.js";



export interface AccessTokenPayload{
    sub:string;
    email:string;
    role:"USER"|"ADMIN"
}
export interface RefreshTokenPayload{
    sub:string;
    jti:string 
    // (unique token ID)
    // just a label — a unique "name tag" stuck onto one specific refresh token, so your server can find that exact one again 
    // later in the database. That's its entire job. Nothing more.
}
const ISSUER ="auth-backend";

export function signAccessToken(payload:AccessTokenPayload): string{
    const options:SignOptions={
        expiresIn:env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
        issuer:ISSUER
    };
    return jwt.sign(payload,env.JWT_ACCESS_SECRET,options)

}

export  function verifyAccessToken(token:string):AccessTokenPayload{
    const decoded= jwt.verify(token,env.JWT_ACCESS_SECRET,{
        issuer:ISSUER
    });
    return decoded as AccessTokenPayload
}

export  function  signRefreshToken(payload:RefreshTokenPayload):string{
    const options:SignOptions={
        expiresIn:env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
        issuer:ISSUER,
    }
    return  jwt.sign(payload,env.JWT_REFRESH_SECRET,options)
}
export function verifyRefreshToken (token:string):RefreshTokenPayload{
    const decoded=jwt.verify(token,env.JWT_REFRESH_SECRET,{
        issuer:ISSUER
    });
    return decoded as RefreshTokenPayload;
}

export interface TwoFactorChallengePayload {
  sub: string;
  type: "2fa";
}

const TWO_FACTOR_CHALLENGE_EXPIRES_IN = "5m";

export function signTwoFactorChallenge(
  payload: TwoFactorChallengePayload
): string {
  return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: TWO_FACTOR_CHALLENGE_EXPIRES_IN,
      issuer: ISSUER,
    }
  );
}

export function verifyTwoFactorChallenge(
  token: string
): TwoFactorChallengePayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ISSUER,
  });

  const payload = decoded as TwoFactorChallengePayload;

  if (payload.type !== "2fa") {
    throw new Error("Invalid 2FA challenge");
  }

  return payload;
}