<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import AccessFrame from "./AccessFrame.vue";
import arrowIcon from "./assets/arrow-left.svg";
import infoIcon from "./assets/info-blue.svg";
import { useRegistration } from "./useRegistration";
import { useVerificationResend } from "./useVerificationResend";

const { fields, errors, state, submittedEmail, submit } = useRegistration();
const resendEmail = ref("");
const { message: resendMessage, blocked: resendBlocked, resend } = useVerificationResend();
</script>

<template>
  <AccessFrame :variant="state === 'success' || state === 'email-unconfirmed' ? 'confirmation' : 'registration'">
    <section class="access-card" aria-labelledby="registration-title">
      <div v-if="state !== 'success' && state !== 'email-unconfirmed'">
        <h1 id="registration-title">Crie sua conta</h1>
        <p class="access-intro">Organize sua prospecção em um só lugar.</p>
      </div>
      <template v-if="state === 'success' || state === 'email-unconfirmed'">
        <div>
          <h1 id="registration-title">Confirme seu email</h1>
          <p v-if="state === 'success'" class="access-intro">Enviamos um link para {{ submittedEmail }}.</p>
          <p v-else class="access-intro">{{ submittedEmail }}</p>
        </div>
        <p v-if="state === 'email-unconfirmed'" class="access-error" role="alert">
          Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link.
        </p>
        <div class="access-note">
          <img :src="infoIcon" alt="" />
          <div>
            <p class="access-note-title">Link único • válido por 24 horas</p>
            <p>Abra o email e use o link para confirmar sua conta. Cada link pode ser usado uma única vez.</p>
          </div>
        </div>
        <div v-if="state === 'success'" class="confirmation-guidance access-intro">
          <p role="status">Conta criada. Confira seu e-mail para confirmar o cadastro.</p>
          <p>Verifique também a pasta de spam. Se o link expirar, solicite um novo envio.</p>
        </div>
        <button class="access-action access-action--secondary" type="button" :disabled="resendBlocked" @click="resend(submittedEmail)">
          Reenviar link de confirmação
        </button>
        <p v-if="resendMessage" class="access-guidance" role="status">{{ resendMessage }}</p>
        <RouterLink class="access-link access-back access-back--center" :to="{ name: 'login' }">
          <img :src="arrowIcon" alt="" /> Voltar para entrar
        </RouterLink>
        <p class="access-guidance">A confirmação do email não contrata nem ativa um plano.</p>
      </template>
      <form v-else class="access-form" novalidate :aria-busy="state === 'submitting'" @submit.prevent="submit">
        <div class="access-fields">
          <label for="name"
            >Nome *
            <input
              id="name"
              v-model="fields.name"
              name="name"
              autocomplete="name"
              required
              :aria-invalid="errors.name ? true : undefined"
              :aria-describedby="errors.name ? 'name-error' : undefined"
            />
            <span v-if="errors.name" id="name-error" class="access-error" role="alert">{{ errors.name }}</span>
          </label>
          <label for="email"
            >E-mail *
            <input
              id="email"
              v-model="fields.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              :aria-invalid="errors.email ? true : undefined"
              :aria-describedby="errors.email ? 'email-error' : undefined"
            />
            <span v-if="errors.email" id="email-error" class="access-error" role="alert">{{ errors.email }}</span>
          </label>
          <label for="password"
            >Senha *
            <input
              id="password"
              v-model="fields.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              :aria-invalid="errors.password ? true : undefined"
              :aria-describedby="errors.password ? 'password-error' : undefined"
            />
            <span v-if="errors.password" id="password-error" class="access-error" role="alert">{{ errors.password }}</span>
          </label>
          <label for="phone"
            >Celular (opcional)
            <input
              id="phone"
              v-model="fields.phone"
              name="phone"
              type="tel"
              autocomplete="tel"
              placeholder="DDD + número"
              :aria-invalid="errors.phone ? true : undefined"
              :aria-describedby="errors.phone ? 'phone-error' : undefined"
            />
            <span v-if="errors.phone" id="phone-error" class="access-error" role="alert">{{ errors.phone }}</span>
          </label>
        </div>
        <p class="access-guidance">
          * Campos obrigatórios. Cadastro exclusivo para desenvolvedores freelancers.
        </p>
        <p v-if="state === 'email-already-registered'" class="access-error" role="alert">
          Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.
        </p>
        <p v-else-if="state === 'outcome-unknown'" class="access-error" role="alert">
          Não conseguimos confirmar o resultado do cadastro. Tente novamente.
        </p>
        <p v-else-if="state === 'error'" class="access-error" role="alert">
          Não foi possível concluir a solicitação.
        </p>
        <button class="access-action" type="submit" :disabled="state === 'submitting'">
          <span v-if="state === 'submitting'" class="spinner" aria-hidden="true"></span>
          {{ state === "submitting" ? "Criando conta…" : "Criar conta" }}
        </button>
      </form>
      <RouterLink
        v-if="state !== 'success' && state !== 'email-unconfirmed'"
        class="access-link access-back"
        :to="{ name: 'login' }"
      >
        <img :src="arrowIcon" alt="" /> Voltar para entrar
      </RouterLink>
    </section>
    <details v-if="state !== 'success' && state !== 'email-unconfirmed'" class="access-resend registration-resend">
        <summary>Reenviar link de confirmação</summary>
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
          <button class="access-action" type="submit" :disabled="resendBlocked || !resendEmail.trim()">Reenviar</button>
          <p v-if="resendMessage" class="access-guidance" role="status">{{ resendMessage }}</p>
        </form>
      </details>

  </AccessFrame>
</template>

<style scoped>
.confirmation-guidance {
  margin-top: 0;
}

.confirmation-guidance p + p {
  margin-top: var(--espaco-xs);
}

.registration-resend {
  width: min(100%, 28rem);
  text-align: center;
}

.registration-resend form {
  padding: var(--espaco-md);
  border: 1px solid var(--desabilitado);
  border-radius: var(--espaco-sm);
  background: var(--superficie);
  text-align: left;
}

.registration-resend :is(label, input) {
  display: block;
  width: 100%;
}

.registration-resend input {
  min-height: 2.5rem;
  margin-top: var(--espaco-sm);
  padding: 0 var(--espaco-md);
  border: 1px solid var(--desabilitado);
  border-radius: var(--espaco-xs);
  font: inherit;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>
