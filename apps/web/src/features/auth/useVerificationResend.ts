import { computed, onScopeDispose, ref } from "vue";
import { resendVerification } from "./email-verification.service";

export function useVerificationResend() {
  const state = ref<"idle" | "submitting" | "requested" | "error">("idle");
  const retryAfterSeconds = ref(0);
  const blocked = computed(() => state.value === "submitting" || retryAfterSeconds.value > 0);
  const message = computed(() => {
    if (state.value === "submitting") return "Solicitando reenvio…";
    if (state.value === "error") return "Não foi possível receber a resposta da solicitação.";
    if (state.value !== "requested") return "";
    const guidance = "Se houver uma conta pendente para este e-mail, verifique sua caixa de entrada.";
    return retryAfterSeconds.value
      ? `${guidance} Aguarde ${retryAfterSeconds.value} segundos para tentar novamente.`
      : guidance;
  });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
    clearTimeout(timeout);
  });

  async function resend(email: string) {
    if (blocked.value || !email.trim()) return;
    state.value = "submitting";
    try {
      const result = await resendVerification(email);
      if (disposed) return;
      retryAfterSeconds.value = result.retryAfterSeconds;
      timeout = setTimeout(() => {
        retryAfterSeconds.value = 0;
      }, result.retryAfterSeconds * 1000);
      state.value = "requested";
    } catch {
      state.value = "error";
    }
  }

  return { message, blocked, resend };
}
