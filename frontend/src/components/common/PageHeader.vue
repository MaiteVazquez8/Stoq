<template>
  <div class="encabezado-vista">
    <div class="encabezado-vista__texto">
      <h1>{{ titulo }}</h1>
      <p v-if="subtitulo">{{ subtitulo }}</p>
    </div>
    <div v-if="$slots.acciones" class="encabezado-vista__acciones">
      <slot name="acciones" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' }
})
</script>
