<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useEmailVerification } from "./useEmailVerification";
import { useVerificationResend } from "./useVerificationResend";

const route = useRoute();
const { state, confirm } = useEmailVerification();
const resendEmail = ref("");
const { message: resendMessage, blocked: resendBlocked, resend } = useVerificationResend();

function confirmLink() {
  return confirm(route.query.token);
}

onMounted(confirmLink);
</script>

<template>
  <header class="access-header">
    <span class="brand">Radar Local</span>
  </header>
  <main class="email-verification">
    <section class="verification-card" aria-labelledby="verification-title">
      <h1 id="verification-title">Confirmação de e-mail</h1>
      <p v-if="state === 'idle' || state === 'confirming'" role="status">Confirmando seu e-mail…</p>
      <p v-else-if="state === 'confirmed'" class="success" role="status">E-mail confirmado</p>
      <p v-else-if="state === 'already-confirmed'" class="success" role="status">
        E-mail já confirmado
      </p>
      <p v-else-if="state === 'invalid'" class="error" role="alert">
        O link de confirmação é inválido.
      </p>
      <template v-else-if="state === 'expired'">
        <p class="error" role="alert">O link de confirmação expirou.</p>
        <details class="resend">
          <summary>Reenviar link de confirmação</summary>
          <form @submit.prevent="resend(resendEmail)">
            <label for="resend-email">E-mail</label>
            <input
              id="resend-email"
              v-model="resendEmail"
              type="email"
              name="email"
              autocomplete="email"
              required
              :disabled="resendBlocked"
            />
            <button type="submit" :disabled="resendBlocked || !resendEmail.trim()">Reenviar</button>
            <p v-if="resendMessage" role="status">{{ resendMessage }}</p>
          </form>
        </details>
      </template>
      <template v-else>
        <p class="error" role="alert">Não foi possível confirmar o e-mail.</p>
        <button class="retry" type="button" @click="confirmLink">Tentar novamente</button>
      </template>
    </section>
  </main>
</template>

<style scoped>
.access-header {
  min-height: 5rem;
  padding: var(--espaco-md) var(--espaco-xl);
  background: var(--superficie);
  border-bottom: 1px solid var(--desabilitado);
  display: flex;
  align-items: center;
}
.brand {
  font-size: var(--titulo-secao);
  font-weight: 600;
}
.email-verification {
  padding: var(--espaco-xl) var(--espaco-md);
  display: flex;
  justify-content: center;
}
.verification-card {
  width: 28rem;
  max-width: 100%;
  background: var(--superficie);
  border: 1px solid var(--desabilitado);
  border-radius: 0.5rem;
  padding: var(--espaco-xl);
}
h1 {
  font-size: var(--titulo-pagina);
  font-weight: 600;
  margin-bottom: var(--espaco-md);
}
.success {
  color: var(--sucesso);
}
.error {
  color: var(--perigo);
}
.retry {
  margin-top: var(--espaco-md);
  min-height: 2.5rem;
  padding: var(--espaco-sm) var(--espaco-md);
  border: 0;
  border-radius: 0.25rem;
  background: var(--primaria);
  color: var(--superficie);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.retry:hover {
  background: var(--primaria-hover);
}
.retry:focus-visible {
  outline: 2px solid var(--primaria);
  outline-offset: 3px;
}
.resend {
  margin-top: var(--espaco-md);
}
.resend summary {
  color: var(--primaria);
  cursor: pointer;
}
.resend summary:focus-visible {
  outline: 2px solid var(--primaria);
  outline-offset: 3px;
}
.resend form {
  margin-top: var(--espaco-md);
  display: grid;
  gap: var(--espaco-sm);
}
.resend input,
.resend button {
  min-height: 2.5rem;
  padding: var(--espaco-sm) var(--espaco-md);
  border: 1px solid var(--desabilitado);
  border-radius: 0.25rem;
  background: var(--superficie);
  color: var(--texto);
  font: inherit;
}
.resend button:enabled {
  background: var(--primaria);
  color: var(--superficie);
  font-weight: 600;
  cursor: pointer;
}
.resend button:hover:enabled {
  background: var(--primaria-hover);
}
.resend input:disabled,
.resend button:disabled {
  background: var(--desabilitado);
  color: var(--texto-suave);
}
.resend input:focus-visible,
.resend button:focus-visible {
  outline: 2px solid var(--primaria);
  outline-offset: 3px;
}
@media (max-width: 40rem) {
  .access-header,
  .verification-card {
    padding: var(--espaco-md);
  }
}
</style>
