<script setup lang="ts">
import type { SessionProfile } from "./session.service";

defineProps<{ profile: SessionProfile }>();
</script>

<template>
  <main>
    <h1>{{ profile.role === "ADMIN" ? "Área da administração" : "Área do desenvolvedor" }}</h1>
    <p>Olá, {{ profile.name }}.</p>
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
