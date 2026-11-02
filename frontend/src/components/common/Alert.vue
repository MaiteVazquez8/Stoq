<template>
  <div v-if="mensaje" class="alerta" :class="claseAlerta">
    <span class="alerta-icono">{{ icono }}</span>
    <span class="alerta-texto">{{ mensaje }}</span>
  </div>
</template>

<script setup>
defineProps({
  mensaje: { type: String, default: '' },
  tipo: { type: String, default: 'info' } // info, exito, error, advertencia
})

const claseAlerta = computed(() => `alerta-${tipo}`)

const icono = computed(() => {
  switch (tipo) {
    case 'exito': return '✓'
    case 'error': return '✕'
    case 'advertencia': return '⚠'
    default: return 'ℹ'
  }
})

import { computed } from 'vue'
</script>

<style scoped>
.alerta {
  padding: var(--espacio-12) var(--espacio-16);
  border-radius: var(--radio-borde);
  margin-bottom: var(--espacio-16);
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: var(--espacio-10);
}

.alerta-exito {
  background-color: var(--color-azul-50);
  border: 1px solid var(--color-azul-200);
  color: var(--color-azul-900);
}

.alerta-error {
  background-color: #FDECEA;
  border: 1px solid #EF9A9A;
  color: #D32F2F;
}

.alerta-advertencia {
  background-color: #FFF3E0;
  border: 1px solid #FFCC80;
  color: #F57C00;
}

.alerta-info {
  background-color: var(--color-azul-50);
  border: 1px solid var(--color-azul-200);
  color: var(--color-azul-900);
}

.alerta-icono {
  flex-shrink: 0;
  margin-top: 2px;
}

.alerta-texto {
  line-height: 1.5;
}
</style>