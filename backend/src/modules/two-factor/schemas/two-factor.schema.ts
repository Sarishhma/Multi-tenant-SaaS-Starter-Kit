import { z } from "zod";

export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Authentication code must be 6 digits"),
});

export const completeTwoFactorLoginSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: z
    .string()
    .regex(/^\d{6}$/, "Authentication code must be 6 digits"),
});

export const twoFactorSetupResponseSchema = z.object({
  secret: z.string().describe("Base32 TOTP secret key"),
  otpauthURl: z.string().describe("otpauth URL to generate authenticator app QR code"),
});

export const twoFactorVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const twoFactorCompleteLoginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});

export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type CompleteTwoFactorLoginInput = z.infer<typeof completeTwoFactorLoginSchema>;
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>;
export type TwoFactorVerifyResponse = z.infer<typeof twoFactorVerifyResponseSchema>;
export type TwoFactorCompleteLoginResponse = z.infer<typeof twoFactorCompleteLoginResponseSchema>;
