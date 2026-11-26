<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useEmailVerification } from "./useEmailVerification";

const route = useRoute();
const { state, confirm } = useEmailVerification();

onMounted(() => confirm(route.query.token));
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
      <p v-else class="error" role="alert">Não foi possível confirmar o e-mail.</p>
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
@media (max-width: 40rem) {
  .access-header,
  .verification-card {
    padding: var(--espaco-md);
  }
}
</style>
