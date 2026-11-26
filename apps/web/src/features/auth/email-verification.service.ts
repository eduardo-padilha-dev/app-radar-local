import { post } from "../../shared/http/client";

interface EmailVerificationResult {
  status: "confirmed";
}

export function verifyEmail(token: string): Promise<EmailVerificationResult> {
  return post<EmailVerificationResult>("/auth/verify-email", { token });
}
