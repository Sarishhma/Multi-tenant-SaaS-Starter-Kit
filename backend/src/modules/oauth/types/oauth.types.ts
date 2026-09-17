export type OAuthProvider = "GOOGLE" | "GITHUB";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};