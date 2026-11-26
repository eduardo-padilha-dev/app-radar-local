import { ref } from "vue";
import { verifyEmail } from "./email-verification.service";

export function useEmailVerification() {
  const state = ref<"idle" | "confirming" | "confirmed" | "failed">("idle");

  async function confirm(token: unknown) {
    if (state.value === "confirming") return;

    if (typeof token !== "string") {
      state.value = "failed";
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
