<template>
  <span class="badge" :class="claseBadge" :style="{ border }">
    {{ texto }}
  </span>
</template>

<script setup>
defineProps({
  texto: { type: String, required: true },
  variante: { type: String, default: 'stock-ok' } // stock-ok, stock-bajo, entrada, salida
})

const claseBadge = computed(() => `badge-${variante}`)

const border = computed(() => {
  switch (variante) {
    case 'stock-bajo': return '1px solid #FFCDD2'
    case 'stock-ok': return '1px solid var(--color-azul-200)'
    case 'entrada': return '1px solid var(--color-azul-200)'
    case 'salida': return '1px solid #FFCDD2'
    default: return '1px solid var(--color-azul-200)'
  }
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--espacio-4) var(--espacio-8);
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
}

.badge-stock-bajo {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.badge-stock-ok {
  background-color: var(--color-azul-50);
  color: var(--color-azul-900);
}

.badge-entrada {
  background-color: var(--color-azul-50);
  color: var(--color-azul-900);
}

.badge-salida {
  background-color: #FFEBEE;
  color: #D32F2F;
}
</style>