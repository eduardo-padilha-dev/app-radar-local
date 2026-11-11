<script setup lang="ts">
import { useRegistration } from "./useRegistration";
const { fields, state, submit } = useRegistration();
</script>

<template>
  <header class="access-header">
    <span class="brand">Radar Local</span>
    <span class="tagline">Prospecção para desenvolvedores freelancers</span>
  </header>
  <main class="registration">
    <section class="registration-card" aria-labelledby="registration-title">
      <div>
        <h1 id="registration-title">Crie sua conta</h1>
        <p class="description">Organize sua prospecção em um só lugar.</p>
      </div>
      <template v-if="state === 'success'">
        <!-- // TODO #3: conectar à confirmação e ao reenvio, incluindo falha do envio inicial. -->
        <p class="success" role="status">
          Conta criada. Confira seu e-mail para confirmar o cadastro.
        </p>
        <p class="guidance">Abra o link recebido para confirmar seu e-mail.</p>
      </template>
      <form v-else :aria-busy="state === 'submitting'" @submit.prevent="submit">
        <div class="fields">
          <label for="name"
            >Nome *
            <input id="name" v-model="fields.name" name="name" autocomplete="name" required />
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
            />
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
            />
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
            />
          </label>
        </div>
        <p class="guidance">
          * Campos obrigatórios. Cadastro exclusivo para desenvolvedores freelancers.
        </p>
        <p v-if="state === 'error'" class="error" role="alert">
          Não foi possível concluir a solicitação.
        </p>
        <button type="submit" :disabled="state === 'submitting'">
          <span v-if="state === 'submitting'" class="spinner" aria-hidden="true"></span>
          {{ state === "submitting" ? "Criando conta…" : "Criar conta" }}
        </button>
      </form>
      <!-- // TODO #4: conectar ao fluxo real de entrada. -->
      <p class="guidance">Já tem uma conta? A entrada estará disponível em breve.</p>
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
  justify-content: space-between;
  gap: var(--espaco-md);
}
.brand {
  font-size: var(--titulo-secao);
  font-weight: 600;
}
.tagline,
.guidance {
  font-size: var(--legenda);
  color: var(--texto-suave);
}
.registration {
  padding: var(--espaco-xl) var(--espaco-md);
  display: flex;
  justify-content: center;
}
.registration-card {
  width: 28rem;
  max-width: 100%;
  background: var(--superficie);
  border: 1px solid var(--desabilitado);
  border-radius: 0.5rem;
  padding: var(--espaco-xl);
  display: flex;
  flex-direction: column;
  gap: var(--espaco-lg);
}
h1 {
  font-size: var(--titulo-pagina);
  font-weight: 600;
}
.description {
  color: var(--texto-suave);
  margin-top: var(--espaco-sm);
}
form {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-lg);
}
.fields {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-md);
}
label {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-sm);
  font-size: var(--legenda);
}
input {
  width: 100%;
  min-height: 2.5rem;
  padding: var(--espaco-sm) var(--espaco-md);
  border: 1px solid var(--desabilitado);
  border-radius: 0.25rem;
  background: var(--superficie);
  color: var(--texto);
  font: inherit;
  font-size: var(--corpo);
}
button {
  min-height: 2.5rem;
  padding: var(--espaco-sm) var(--espaco-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--espaco-sm);
  border: 0;
  border-radius: 0.25rem;
  background: var(--primaria);
  color: var(--superficie);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
button:hover:enabled {
  background: var(--primaria-hover);
}
button:disabled {
  background: var(--desabilitado);
  color: var(--texto-suave);
  cursor: wait;
}
input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--primaria);
  outline-offset: 3px;
}
.success {
  color: var(--sucesso);
}
.error {
  color: var(--perigo);
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
@media (max-width: 40rem) {
  .access-header {
    padding: var(--espaco-md);
  }
  .tagline {
    display: none;
  }
  .registration-card {
    padding: var(--espaco-md);
  }
}
</style>
