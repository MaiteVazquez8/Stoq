<template>
  <footer class="pie-app">
    {{ negocio.nombre }} · {{ negocio.etiqueta }}
  </footer>
</template>

<script setup>
import { negocio } from '@/data/business'
</script>
