<template>
  <button
    :type="tipo"
    class="btn"
    :class="[varianteClase, { 'btn-bloque': bloque, 'btn-grande': grande }]"
    :disabled="deshabilitado || cargando"
    :aria-busy="cargando ? 'true' : 'false'"
  >
    <Icon v-if="cargando" nombre="cargando" :tamano="14" class="spinner-icono" />
    <Icon v-else-if="icono" :nombre="icono" :tamano="16" />
    <span v-if="cargando && textoCargando">{{ textoCargando }}</span>
    <slot v-else />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/common/Icon.vue'

const props = defineProps({
  variante: {
    type: String,
    default: 'principal',
    validator: (valor) => ['principal', 'secundario', 'discreto', 'icono'].includes(valor)
  },
  tipo: { type: String, default: 'button' },
  icono: { type: String, default: '' },
  cargando: { type: Boolean, default: false },
  textoCargando: { type: String, default: 'Guardando…' },
  deshabilitado: { type: Boolean, default: false },
  bloque: { type: Boolean, default: false },
  grande: { type: Boolean, default: false },
  etiqueta: { type: String, default: '' }
})

const varianteClase = computed(() => `btn-${props.variante === 'icono' ? 'icono' : props.variante}`)
</script>
