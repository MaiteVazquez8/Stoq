<template>
  <div class="aviso" :class="{ 'aviso--bloque': bloque }" role="status">
    <Icon class="aviso__icono" :nombre="icono" :tamano="18" />
    <div>
      <p v-if="titulo" class="aviso__titulo">{{ titulo }}</p>
      <p v-if="mensaje" class="aviso__texto">{{ mensaje }}</p>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/common/Icon.vue'

const props = defineProps({
  // 'info' | 'exito' | 'error'
  tipo: { type: String, default: 'info' },
  titulo: { type: String, default: '' },
  mensaje: { type: String, default: '' },
  bloque: { type: Boolean, default: true }
})

const icono = computed(() => {
  if (props.tipo === 'exito') return 'check-circulo'
  if (props.tipo === 'error') return 'alerta'
  return 'info'
})
</script>
