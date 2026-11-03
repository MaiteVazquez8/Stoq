<template>
  <footer class="pie-app">
    {{ negocio.nombre }} · Datos de demostración · {{ negocio.hoyTexto }}
  </footer>
</template>

<script setup>
import { negocio } from '@/data/business'
</script>
