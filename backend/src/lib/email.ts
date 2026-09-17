import nodemailer  from "nodemailer"
import { env } from "../config/env.js"
 const transporter= nodemailer.createTransport({
    // nodemailer.createTransport(...) runs once, at module load time — not inside sendOtpEmail. This is the same singleton
    //  principle as prisma.ts. If we created a new transporter every time we sent an email, we'd be opening a fresh SMTP connection
    //  per request — slow and wasteful. One transporter, reused for every email sent for the entire lifetime of your server.
    host:env.EMAIL_HOST,
    port:env.EMAIL_PORT,
    secure:env.EMAIL_PORT===465,

    // — this is a real SMTP detail worth knowing: port 465 uses SSL/TLS from the very first byte of the connection 
    // ("implicit TLS"). Port 587 (what you're using with Gmail) starts as plain text and upgrades to TLS mid-connection 
    // ("STARTTLS"). Nodemailer needs to know which mode to use, and get it wrong and the connection silently fails or errors 
    // oddly.
    auth:{
        user:env.EMAIL_USER,
        pass:env.EMAIL_PASS,
    }
 })
export async function sendOtpEmail(to:string,otp:string):Promise<void>{
    await transporter.sendMail({
        from:env.EMAIL_FROM,
        to,
        subject:"Your verification code",
            html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</p>
        <p>This code expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    })
}