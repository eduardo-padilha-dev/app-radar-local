import { HttpError, post } from "../../shared/http/client";

interface EmailVerificationResult {
  status: "confirmed" | "already-confirmed";
}

export type EmailVerificationOutcome = EmailVerificationResult | { status: "invalid" | "expired" };

export async function verifyEmail(token: string): Promise<EmailVerificationOutcome> {
  try {
    return await post<EmailVerificationResult>("/auth/verify-email", { token });
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.statusCode === 400 && error.code === "VERIFICATION_LINK_INVALID") {
        return { status: "invalid" };
      }
      if (error.statusCode === 410 && error.code === "VERIFICATION_LINK_EXPIRED") {
        return { status: "expired" };
      }
    }
    throw error;
  }
}
