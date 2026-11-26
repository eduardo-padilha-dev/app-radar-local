<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useLogin } from "./useLogin";

const { fields, submitting, error, submit } = useLogin();
</script>

<template>
  <main>
    <section aria-labelledby="login-title">
      <h1 id="login-title">Entre na sua conta</h1>
      <form :aria-busy="submitting" @submit.prevent="submit">
        <label for="login-email">
          E-mail
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
          Senha
          <input
            id="login-password"
            v-model="fields.password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>
        <p v-if="error" role="alert">{{ error }}</p>
        <button type="submit" :disabled="submitting">{{ submitting ? "Entrando…" : "Entrar" }}</button>
      </form>
      <RouterLink :to="{ name: 'register' }">Criar conta</RouterLink>
    </section>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--espaco-md);
}

section {
  width: min(100%, 28rem);
  display: grid;
  gap: var(--espaco-lg);
  padding: var(--espaco-lg);
  background: var(--superficie);
  border: 1px solid var(--desabilitado);
  border-radius: var(--espaco-sm);
}

h1 {
  font-size: var(--titulo-pagina);
}

form,
label {
  display: grid;
  gap: var(--espaco-sm);
}

form {
  gap: var(--espaco-md);
}

input,
button {
  font: inherit;
  border-radius: var(--espaco-xs);
  padding: var(--espaco-sm);
}

input {
  border: 1px solid var(--texto-suave);
}

button {
  border: 0;
  background: var(--primaria);
  color: var(--superficie);
}

button:disabled {
  background: var(--desabilitado);
  color: var(--texto-suave);
}

[role="alert"] {
  color: var(--perigo);
}
</style>
