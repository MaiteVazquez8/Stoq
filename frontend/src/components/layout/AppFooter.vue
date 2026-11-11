<template>
  <footer class="pie-app">
    <Marca variante="isotipo" :altura="18" />
    <span>{{ negocio.nombre }} · {{ negocio.etiqueta }}</span>
  </footer>
</template>

<script setup>
import Marca from '@/components/common/Marca.vue'
import { negocio } from '@/data/business'
</script>

<style scoped>
.pie-app {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-8);
}
</style>
