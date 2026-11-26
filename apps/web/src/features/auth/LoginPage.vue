<script setup lang="ts">
import { RouterLink } from "vue-router";
import AccessFrame from "./AccessFrame.vue";
import infoIcon from "./assets/info.svg";
import { useLogin } from "./useLogin";

const { fields, submitting, error, submit } = useLogin();
</script>

<template>
  <AccessFrame>
    <section class="access-card" aria-labelledby="login-title">
      <div>
        <h1 id="login-title">Entre no Radar Local</h1>
        <p class="access-intro">Seu próximo projeto começa por aqui.</p>
      </div>
      <form class="access-form" :aria-busy="submitting" @submit.prevent="submit">
        <div class="access-fields">
          <label for="login-email">
            Email *
            <input
              id="login-email"
              v-model="fields.email"
              name="email"
              type="email"
              autocomplete="username"
              required
            />
          </label>
          <label for="login-password">
            Senha *
            <input
              id="login-password"
              v-model="fields.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>
        </div>
        <p v-if="error" class="access-error" role="alert">{{ error }}</p>
        <button class="access-action" type="submit" :disabled="submitting">
          {{ submitting ? "Entrando…" : "Entrar" }}
        </button>
      </form>
      <aside class="access-note">
        <img :src="infoIcon" alt="" />
        <div>
          <p>Ainda não confirmou o email?</p>
          <p>Você pode entrar. A busca fica bloqueada até confirmar, sem consumir sua demonstração.</p>
        </div>
      </aside>
      <p class="login-signup">
        Não tem uma conta?
        <RouterLink class="access-link" :to="{ name: 'register' }">Criar conta</RouterLink>
      </p>
    </section>
  </AccessFrame>
</template>

<style scoped>
.login-signup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--espaco-sm);
  padding-top: var(--espaco-lg);
  border-top: 1px solid var(--desabilitado);
  font-size: var(--legenda);
}
</style>
