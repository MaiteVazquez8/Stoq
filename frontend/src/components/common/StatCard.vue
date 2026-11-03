<template>
  <div class="metrica">
    <span class="metrica__etiqueta">{{ etiqueta }}</span>
    <span class="metrica__valor">{{ valor }}</span>
    <span v-if="contexto" class="metrica__contexto">{{ contexto }}</span>
  </div>
</template>

<script setup>
defineProps({
  etiqueta: { type: String, required: true },
  valor: { type: [String, Number], required: true },
  contexto: { type: String, default: '' }
})
</script>
