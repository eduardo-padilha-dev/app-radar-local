import { ref } from "vue";
import { type EmailVerificationOutcome, verifyEmail } from "./email-verification.service";

export function useEmailVerification() {
  const state = ref<"idle" | "confirming" | EmailVerificationOutcome["status"] | "failed">("idle");

  async function confirm(token: unknown) {
    if (state.value === "confirming") return;

    if (typeof token !== "string") {
      state.value = "invalid";
      return;
    }

    state.value = "confirming";
    try {
      const result = await verifyEmail(token);
      state.value = result.status;
    } catch {
      state.value = "failed";
    }
  }

  return { state, confirm };
}
