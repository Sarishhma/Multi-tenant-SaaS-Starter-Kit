
import { randomUUID } from "crypto";
import { env } from "../../../config/env.js";
import { sendOtpEmail } from "../../../lib/email.js";
import { comparepassword, hashPassword } from "../../../lib/password.js";
import { badRequest, conflict, forbidden, notFound, tooManyRequests, unauthorized } from "../../../utils/app-error.js";
import { generateOtp, getOtpExpiry, hashOtp, isOtpExpired, verifyOtpHash } from "../../../utils/otp.js";
import { signAccessToken, signRefreshToken, signTwoFactorChallenge, verifyRefreshToken, verifyTwoFactorChallenge } from "../../../utils/token.js";
import { createPasswordResetOtp,  createUser, createVerificationOtp, deletePasswordResetOtpsForUser, deleteVerificationOtpsForUser,  findLatestPasswordResetOtp, findLatestVerificationOtp,  finduserByEmail, findUserById, incrementFailedLoginAttempts, incrementOtpAttempts, incrementPasswordResetAttempts, lockUserAccount, markEmailAsVerified, resetLoginAttempts,  updateUserPassword  } from "../repositories/auth.repository.js";
import { consumeRefreshToken, createRefreshToken, findRefreshTokenById, revokeAllUserRefreshTokens, revokeRefreshToken, revokeTokenFamily } from "../../sessions/repositories/session.repository.js";
import { logAuditEvent } from "../../audit/services/audit.service.js";
import { verify } from "otplib";
import { decrypt, encrypt } from "../../../lib/encryption.js";




const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const REFRESH_TOKEN_GRACE_MS = 5000;
const MAX_FAILED_ATTEMPTS=5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

function calculateLockoutDuration(failedLoginAttempts:number):number {
     // Number of times they've been locked out before, based on how far past the threshold they are
    const lockoutCount = Math.floor(failedLoginAttempts/MAX_FAILED_ATTEMPTS);
    const baseMinutes =1 ;
    const minutes = baseMinutes* Math.pow(5,lockoutCount-1)// 1min, 5min, 25min, 125min...
    return minutes * 60 * 1000
}
// this is for user registration
export async function  registerUser(email:string,password:string){
    const existingUser =await finduserByEmail(email)
    if(existingUser){
        throw conflict("An account with this email already exists")
    }
 
const passwordHash= await hashPassword(password);
const user =await createUser(email,passwordHash)

// Audit successful registration
await logAuditEvent(
    "REGISTER",
    user.id
);

await deleteVerificationOtpsForUser(user.id)
const otp = generateOtp();
const otpHash=hashOtp(otp)
const expiresAt=getOtpExpiry()

await createVerificationOtp(user.id,otpHash,expiresAt)
await sendOtpEmail(user.email,otp)

return {
        message: "Registration successful. Please check your email for the verification code.",
    userId: user.id,
}
}

// this is for verifying email
export async function verifyEmail(email:string,otp:string){
const user = await finduserByEmail(email)
if(!user){
    throw notFound("No account with this email");
}
if(user.isEmailVerified){
    throw badRequest("This email is already verified")
}


const otpRecord=await findLatestVerificationOtp(user.id);
if(!otpRecord){
    throw badRequest("No verification vode found .Please request a new one ")
}
  if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw tooManyRequests("Too many incorrect attempts. Please request a new code");
  }
    if (isOtpExpired(otpRecord.expiresAt)) {
    throw badRequest("This verification code has expired. Please request a new one");
  }
  const isValid= verifyOtpHash(otp,otpRecord.otpHash);
    if (!isValid) {
    await incrementOtpAttempts(otpRecord.id);
    throw badRequest("Incorrect verification code");
  }

  await markEmailAsVerified(user.id);

  await logAuditEvent(
    "EMAIL_VERIFIED",
    user.id
  )
  await deleteVerificationOtpsForUser(user.id);
    return { message: "Email verified successfully. You can now log in." };

}

type LoginResult =
  | {
      requiresTwoFactor: true;
      challengeToken: string;
    }
  | {
      requiresTwoFactor: false;
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        role: "USER" | "ADMIN";
      };
    };
// this is for login  or This is where the isEmailVerified gate actually gets enforced, plus real token issuance.
export async function loginUser(
    email:string,
    password:string,
    userAgent?:string,
    ipAddress?:string
):Promise<LoginResult>{
    const user = await finduserByEmail(email);
    if(!user){
        throw unauthorized("Invalid email or password")
    }
  // Check lockout BEFORE checking the password
  if(user.lockedUntil && user.lockedUntil >new Date()){
    const minutesLeft = Math.ceil((user.lockedUntil.getTime()- Date.now())/60000);
    throw forbidden(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`)
  }
    if(!user.password){
      throw unauthorized("Invalid email or password")
    }
    const isPasswordvalid= await  comparepassword(password,user.password);
    if(!isPasswordvalid){
        const newAttempts =user.failedLoginAttempts +1;
        if(newAttempts >= MAX_FAILED_ATTEMPTS && newAttempts% MAX_FAILED_ATTEMPTS===0){
         const lockoutMs = calculateLockoutDuration(newAttempts);
         const lockedUntil= new Date(Date.now()+lockoutMs);
         await lockUserAccount(user.id,lockedUntil)

         await logAuditEvent(
            "ACCOUNT_LOCKED",
            user.id,
            ipAddress,
            userAgent
         )
        }
        await incrementFailedLoginAttempts(user.id);

        await logAuditEvent(
            "LOGIN_FAILED",
            user.id,
            ipAddress,
            userAgent
        )

        throw unauthorized("invalid email or password")
    }
    if(!user.isEmailVerified){
        throw forbidden("Please verify  your email before logging in ")
    }



    await resetLoginAttempts(user.id)

    
  // -----------------------------------------
  // 2FA CHECK
  // -----------------------------------------

  if (user.isTwoFactorEnabled) {
    const challengeToken = signTwoFactorChallenge({
      sub: user.id,
      type: "2fa",
    });

    return {
      requiresTwoFactor: true,
      challengeToken,
    };
  }
    // -----------------------------------------
  // NORMAL LOGIN — NO 2FA
  // -----------------------------------------
  // Successful login — wipe the slate clean

  await logAuditEvent(
    "LOGIN_SUCCESS",
    user.id,
    ipAddress,
    userAgent
  );


    const accessToken = signAccessToken({sub:user.id, email:user.email,role:user.role});

    const tokenId = randomUUID();
    const sessionId = randomUUID();
    const familyId=randomUUID()
    const refreshToken=signRefreshToken({sub:user.id,jti:tokenId});
    const refreshTokenHash= hashOtp(refreshToken);// reusing our sha256 hash helper
    const refreshExpiresAt= new Date(Date.now()+REFRESH_TOKEN_MS);

await createRefreshToken(tokenId,sessionId,familyId,user.id,refreshTokenHash,refreshExpiresAt,userAgent,ipAddress);
return{
    requiresTwoFactor:false,
    accessToken,
    refreshToken,
    user:{id:user.id,email:user.email,role:user.role}
}

}
//refreshToken access
export async function refreshAccessToken(refreshToken:string){
    let decoded;
    try{
        decoded= verifyRefreshToken(refreshToken)
    }catch{
        throw unauthorized("Invalid or expired refresh Token")
    }
    const tokenrecord= await findRefreshTokenById(decoded.jti)
    if(!tokenrecord){
         throw unauthorized("Invalid or expired refresh Token")
    }

    const user = await findUserById(tokenrecord.userId)// 2. fetch the user this token belongs to
      if (!user) {
    throw unauthorized("Invalid or expired refresh token");
  }

if (tokenrecord.revokedAt) {
    // Was this token normally replaced recently?
    if (tokenrecord.replacedAt) {
        const timeSinceReplacement =
            Date.now() - tokenrecord.replacedAt.getTime();

      if (timeSinceReplacement <= REFRESH_TOKEN_GRACE_MS &&
    tokenrecord.replacementTokenEncrypted
        ) {
            const replacementToken = decrypt(
                tokenrecord.replacementTokenEncrypted
            );

            const accessToken = signAccessToken({
                sub: user.id,
                email: user.email,
                role: user.role,
            });

            return {
                accessToken,
                refreshToken: replacementToken,
            };
        }
    }

    // Old token was reused suspiciously
    await logAuditEvent(
        "TOKEN_REUSE_DETECTED",
        tokenrecord.userId
    );

    await revokeTokenFamily(tokenrecord.familyId);

    throw unauthorized(
        "Session invalid. Please log in again"
    );
}
    if(isOtpExpired(tokenrecord.expiresAt)){// 1. is the OLD token itself expired?
          throw unauthorized("Invalid or expired refresh token");
    }


   // Rotate: revoke the old refresh token, issue a brand new one

const newAccessToken= signAccessToken({sub:user.id,email:user.email,role:user.role})

const newTokenId = randomUUID()
const newRefreshToken= signRefreshToken({
  sub:user.id,
  jti:newTokenId
})
const newRefreshTokenHash= hashOtp(newRefreshToken)
const newExpireAt = new Date(Date.now()+ REFRESH_TOKEN_MS)
const replacementTokenEncrypted = encrypt(newRefreshToken);

const result = await consumeRefreshToken(
    tokenrecord.id,
    newTokenId,
        replacementTokenEncrypted
);
if (result.count === 0) {
    const updatedTokenRecord = await findRefreshTokenById(
        tokenrecord.id
    );

    if (
        updatedTokenRecord?.revokedAt &&
        updatedTokenRecord.replacedAt &&
        updatedTokenRecord.replacementTokenEncrypted
    ) {
        const timeSinceReplacement =
            Date.now() -
            updatedTokenRecord.replacedAt.getTime();

        if (timeSinceReplacement <= REFRESH_TOKEN_GRACE_MS) {
            const replacementToken = decrypt(
                updatedTokenRecord.replacementTokenEncrypted
            );

            const accessToken = signAccessToken({
                sub: user.id,
                email: user.email,
                role: user.role,
            });

            return {
                accessToken,
                refreshToken: replacementToken,
            };
        }
    }

    await logAuditEvent(
        "TOKEN_REUSE_DETECTED",
        tokenrecord.userId
    );

    await revokeTokenFamily(tokenrecord.familyId);

    throw unauthorized(
        "Session invalid. Please log in again"
    );
}

await createRefreshToken(   
  newTokenId,
    tokenrecord.sessionId,
    tokenrecord.familyId,
     user.id,
    newRefreshTokenHash,
    newExpireAt,
    tokenrecord.userAgent ?? undefined,
    tokenrecord.ipAddress ?? undefined)//save to db
return{
    accessToken:newAccessToken,
    refreshToken:newRefreshToken
}

}

//logoutuser
export async function logoutUser(refreshToken:string){
    let decoded;
    try{
        decoded = verifyRefreshToken(refreshToken)

    }catch{
         return { message: "Logged out" };
    }
    const tokenRecord = await findRefreshTokenById(decoded.jti)
    // Only reached if the token verified successfully above. Now we take the jti (the unique ID we signed into the token back when
    //      it was issued) and use it to look up 
    // the exact matching row in your RefreshToken database table
    if(tokenRecord){
            await revokeRefreshToken(tokenRecord.id);
            await logAuditEvent(
                "LOGOUT",
                tokenRecord.userId
            )
    }
return{message:"Loged Out"}
}

export async function resendOtp(email:string){
const user = await finduserByEmail(email)
if(!user){
    throw notFound("NO account with this email")

}
if(user.isEmailVerified){
    throw badRequest("This email is already verified")
}
    // Check resend cooldown
 const latestOtp = await findLatestVerificationOtp(user.id);
     if (latestOtp) {
        const timeSinceLastOtp =
            Date.now() - latestOtp.createdAt.getTime();

        if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_MS) {
            const secondsRemaining = Math.ceil(
                (OTP_RESEND_COOLDOWN_MS - timeSinceLastOtp) / 1000
            );

            throw tooManyRequests(
                `Please wait ${secondsRemaining} seconds before requesting a new code`
            );
        }
    }
await deleteVerificationOtpsForUser(user.id)

const otp = generateOtp();
const otpHash=hashOtp(otp);
const expiresAt= getOtpExpiry();

await createVerificationOtp(user.id,otpHash,expiresAt)
await sendOtpEmail(user.email,otp)

 return { message: "A new verification code has been sent to your email." };

}

//forgot password 

export async function forgotPassword(email:string){
    const user = await finduserByEmail(email);
    // Deliberately do NOT throw an error if user doesn't exist — explained below
    if(!user){
        return{message:"If an account with this email exists, a reset code has been sent."}
    }
    await deletePasswordResetOtpsForUser(user.id)

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expireAt=getOtpExpiry();

    await createPasswordResetOtp(user.id,otpHash,expireAt)
    await sendOtpEmail(user.email,otp)
    return { message: "If an account with this email exists, a reset code has been sent." }; 
}

export async function resetPassword(email:string,otp:string,newPassword:string){
    const user = await finduserByEmail(email);
    if(!user){
        throw notFound("No account found with this email")
    }
    const otpRecord =await findLatestPasswordResetOtp(user.id);
    if(!otpRecord){
            throw badRequest("No reset code found. Please request a new one");
    }
      if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw tooManyRequests("Too many incorrect attempts. Please request a new code");
  }

  if (isOtpExpired(otpRecord.expiresAt)) {
    throw badRequest("This reset code has expired. Please request a new one");
  }
  const isValid =verifyOtpHash(otp,otpRecord.otpHash)
    if (!isValid) {
    await incrementPasswordResetAttempts(otpRecord.id);
    throw badRequest("Incorrect reset code");

  }

  const newPasswordHash =await hashPassword(newPassword);
  await updateUserPassword(user.id,newPasswordHash)


  await deletePasswordResetOtpsForUser(user.id);
  await revokeAllUserRefreshTokens(user.id);

  await logAuditEvent(
    "PASSWORD_RESET",
    user.id
  )

  return { message: "Password reset successfully. Please log in with your new password." };


}
// complete 2FA login — called after the user submits their TOTP code
export async function completeTwoFactorLogin(
  challengeToken: string,
  code: string,
  userAgent?: string,
  ipAddress?: string
) {
  // 1. Verify the short-lived challenge token (5 min expiry)
  let payload: { sub: string; type: string };
  try {
    payload = verifyTwoFactorChallenge(challengeToken);
  } catch {
    throw unauthorized("Invalid or expired 2FA challenge token");
  }

  // 2. Load the user
  const user = await findUserById(payload.sub);
  if (!user) {
    throw unauthorized("User not found");
  }
  if (!user.isTwoFactorEnabled || !user.totpSecret) {
    throw badRequest("Two-factor authentication is not enabled for this account");
  }

  // 3. Verify the TOTP code against the stored secret
  const isValid = verify({ secret: user.totpSecret, token: code });
  if (!isValid) {
    throw unauthorized("Invalid 2FA code");
  }

  // 4. Issue real auth tokens now that 2FA is confirmed
  await logAuditEvent("LOGIN_SUCCESS", user.id, ipAddress, userAgent);

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  const tokenId = randomUUID();
  const sessionId = randomUUID();
  const familyId = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti: tokenId });
  const refreshTokenHash = hashOtp(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);

  await createRefreshToken(
    tokenId,
    sessionId,
    familyId,
    user.id,
    refreshTokenHash,
    refreshExpiresAt,
    userAgent,
    ipAddress
  );

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}
