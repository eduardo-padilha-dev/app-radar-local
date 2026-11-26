<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AccessFrame from "./AccessFrame.vue";
import arrowIcon from "./assets/arrow-left.svg";
import alertIcon from "./assets/circle-alert.svg";
import checkIcon from "./assets/circle-check.svg";
import { useEmailVerification } from "./useEmailVerification";
import { useVerificationResend } from "./useVerificationResend";

const route = useRoute();
const { state, confirm } = useEmailVerification();
const resendEmail = ref("");
const { message: resendMessage, blocked: resendBlocked, resend } = useVerificationResend();
const confirmed = computed(() => state.value === "confirmed" || state.value === "already-confirmed");
const invalid = computed(() => state.value === "invalid" || state.value === "expired");

function confirmLink() {
  return confirm(route.query.token);
}

onMounted(confirmLink);
</script>

<template>
  <AccessFrame variant="verification-result">
    <section class="access-card access-card--result" aria-labelledby="verification-title">
      <h1 id="verification-title">
        {{ confirmed ? "Email confirmado" : invalid ? "Link inválido ou expirado" : "Confirmação de e-mail" }}
      </h1>
      <p v-if="state === 'idle' || state === 'confirming'" role="status">Confirmando seu e-mail…</p>
      <template v-else-if="confirmed">
        <div class="access-note">
          <img :src="checkIcon" alt="" />
          <div>
            <p class="access-success" role="status">
              {{ state === "confirmed" ? "E-mail confirmado" : "E-mail já confirmado" }}
            </p>
            <p>Sua conta está pronta para usar a busca disponível para você.</p>
          </div>
        </div>
        <p>Confirmar o email não ativa um plano pago.</p>
        <RouterLink class="access-action verification-primary" :to="{ name: 'login' }">
          Entrar na conta
        </RouterLink>
      </template>
      <template v-else-if="invalid">
        <div class="access-note">
          <img :src="alertIcon" alt="" />
          <div>
            <p class="access-error" role="alert">
              {{ state === "expired" ? "O link de confirmação expirou." : "O link de confirmação é inválido." }}
            </p>
            <p v-if="state === 'expired'">Solicite um novo link para confirmar sua conta.</p>
          </div>
        </div>
        <template v-if="state === 'expired'">
          <p>O novo link é único e válido por 24 horas.</p>
          <details class="access-resend">
            <summary class="access-action verification-primary">Reenviar link de confirmação</summary>
            <form @submit.prevent="resend(resendEmail)">
              <label for="resend-email">
                E-mail
                <input
                  id="resend-email"
                  v-model="resendEmail"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  :disabled="resendBlocked"
                />
              </label>
              <button class="access-action" type="submit" :disabled="resendBlocked || !resendEmail.trim()">
                Reenviar
              </button>
              <p v-if="resendMessage" class="access-guidance" role="status">{{ resendMessage }}</p>
            </form>
          </details>
        </template>
        <RouterLink class="access-link access-back access-back--center" :to="{ name: 'login' }">
          <img :src="arrowIcon" alt="" /> Voltar para entrar
        </RouterLink>
      </template>
      <template v-else>
        <p class="access-error" role="alert">Não foi possível confirmar o e-mail.</p>
        <button class="access-action verification-primary" type="button" @click="confirmLink">
          Tentar novamente
        </button>
      </template>
    </section>
  </AccessFrame>
</template>

<style scoped>
.verification-primary {
  align-self: flex-start;
  width: fit-content;
}
.access-resend summary {
  display: inline-flex;
  color: var(--superficie);
  text-decoration: none;
}
</style>
