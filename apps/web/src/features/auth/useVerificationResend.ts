import { computed, onScopeDispose, ref } from "vue";
import { resendVerification } from "./email-verification.service";

const fallbackRetryAfterSeconds = 60;

export function useVerificationResend() {
  const state = ref<"idle" | "submitting" | "requested" | "error">("idle");
  const retryAfterSeconds = ref(0);
  const blocked = computed(() => state.value === "submitting" || retryAfterSeconds.value > 0);
  const message = computed(() => {
    if (state.value === "idle") return "";
    if (state.value === "submitting") return "Solicitando reenvio…";
    const guidance = state.value === "error"
      ? "Não foi possível receber a resposta da solicitação."
      : "Se houver uma conta pendente para este e-mail, verifique sua caixa de entrada.";
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
    let seconds = fallbackRetryAfterSeconds;
    let outcome: "requested" | "error" = "requested";
    try {
      const result = await resendVerification(email);
      seconds = result.retryAfterSeconds;
    } catch {
      outcome = "error";
    }
    if (disposed) return;

    retryAfterSeconds.value = seconds;
    timeout = setTimeout(() => {
      retryAfterSeconds.value = 0;
    }, seconds * 1000);
    state.value = outcome;
  }

  return { message, blocked, resend };
}
