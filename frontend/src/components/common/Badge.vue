<template>
  <span class="badge-stock" :class="`badge-stock--${estado}`">
    <Icon v-if="estado === 'suficiente'" nombre="check" :tamano="14" />
    <span v-else-if="estado === 'bajo'" aria-hidden="true">!</span>
    <Icon v-else nombre="equis" :tamano="14" />
    <span>{{ etiqueta }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/common/Icon.vue'

const props = defineProps({
  // 'suficiente' | 'bajo' | 'agotado'
  estado: { type: String, default: 'suficiente' },
  texto: { type: String, default: '' }
})

const etiqueta = computed(() => {
  if (props.texto) return props.texto
  if (props.estado === 'agotado') return 'Agotado'
  if (props.estado === 'bajo') return 'Stock bajo'
  return 'Suficiente'
})
</script>
