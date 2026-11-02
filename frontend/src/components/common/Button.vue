<template>
  <button
    :class="['btn', `btn-${variant}`, size && `btn-${size}`, { 'btn-cargando': cargando, 'btn-pequeno': size === 'pequeno' }]"
    :disabled="disabled || cargando"
    @click="$emit('click', $event)"
    type="button"
  >
    <span v-if="cargando" class="cargando-spinner">⟳</span>
    <span v-else>{{ texto }}</span>
  </button>
</template>

<script setup>
defineProps({
  texto: { type: String, required: true },
  variant: { type: String, default: 'principal' },
  size: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  cargando: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-8);
  padding: var(--espacio-12) var(--espacio-24);
  font-family: var(--fuente-principal);
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--radio-borde);
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid var(--color-azul-500);
  outline-offset: 2px;
}

.btn-principal {
  background-color: var(--color-azul-500);
  color: var(--color-blanco);
}

.btn-principal:hover:not(:disabled) {
  background-color: #1976D2;
}

.btn-secundario {
  background-color: var(--color-blanco);
  color: var(--color-azul-900);
  border: var(--borde-base);
}

.btn-secundario:hover:not(:disabled) {
  background-color: var(--color-gris-fondo);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-azul-500);
  border: 1px solid var(--color-azul-500);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--color-azul-50);
}

.btn-pequeno {
  padding: var(--espacio-8) var(--espacio-16);
  font-size: 13px;
}

.cargando-spinner {
  display: inline-block;
  animation: girar 1s linear infinite;
}

@keyframes girar {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>