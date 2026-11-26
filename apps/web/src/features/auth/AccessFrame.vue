<script setup lang="ts">
import radarIcon from "./assets/radar.svg";
import "./access.css";

defineProps<{ variant?: "registration" | "confirmation" | "verification-result" }>();
</script>

<template>
  <header class="access-header">
    <span class="access-brand">
      <span class="access-brand-symbol"><img :src="radarIcon" alt="" /></span>
      Radar Local
    </span>
    <span class="access-tagline">Prospecção para desenvolvedores freelancers</span>
  </header>
  <main class="access-main" :class="variant && `access-main--${variant}`">
    <slot />
  </main>
</template>
