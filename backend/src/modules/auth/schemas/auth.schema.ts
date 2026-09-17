import { z } from "zod";
import { userSchema } from "../../../common/common.schema.js";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});
 
export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "Otp must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSuccessResponseSchema = z.object({
  requiresTwoFactor: z.literal(false).optional().describe("False when 2FA is not required"),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});

export const loginRequires2FAResponseSchema = z.object({
  requiresTwoFactor: z.literal(true).describe("True when 2FA is required"),
  challengeToken: z.string().describe("Temporary challenge token to submit with TOTP code"),
});

export const loginResponseSchema = z.union([
  loginSuccessResponseSchema,
  loginRequires2FAResponseSchema,
]);

export const refreshResponseSchema = z.object({
  message: z.string().describe("Confirmation message"),
});

export const meResponseSchema = z.object({
  user: userSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;   
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;  
export type LoginResponse = z.infer<typeof loginResponseSchema>;
