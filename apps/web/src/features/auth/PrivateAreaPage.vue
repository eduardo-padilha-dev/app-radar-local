<script setup lang="ts">
import { RouterLink } from "vue-router";
import { type SessionProfile } from "./session.service";
import { usePrivateSession } from "./usePrivateSession";

const { profile } = defineProps<{ profile: SessionProfile }>();
const { state, revalidateSession, logoutStatus, endSession } = usePrivateSession(profile);
</script>

<template>
  <main>
    <template v-if="state.status === 'verified'">
      <template v-if="logoutStatus === 'idle'">
        <h1>{{ state.profile.role === "ADMIN" ? "Área da administração" : "Área do desenvolvedor" }}</h1>
        <p>Olá, {{ state.profile.name }}.</p>
      </template>
      <p v-if="logoutStatus === 'failed'" role="alert">Não foi possível sair da conta.</p>
      <button type="button" :disabled="logoutStatus === 'pending'" @click="endSession">
        {{ { idle: "Sair", pending: "Saindo…", failed: "Tentar novamente" }[logoutStatus] }}
      </button>
    </template>
    <RouterLink v-else-if="state.status === 'signed-out'" :to="{ name: 'login' }">Entrar</RouterLink>
    <p v-else-if="state.status === 'checking'" role="status">Verificando sua sessão…</p>
    <template v-else>
      <p role="alert">Não foi possível verificar sua sessão.</p>
      <button type="button" @click="revalidateSession">Tentar novamente</button>
    </template>
  </main>
</template>

<style scoped>
main {
  max-width: 68rem;
  margin-inline: auto;
  padding: var(--espaco-xl);
}

h1 {
  font-size: var(--titulo-pagina);
}
</style>
