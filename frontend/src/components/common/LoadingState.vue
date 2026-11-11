<template>
  <div class="estado-carga" role="status" aria-live="polite">
    <span class="estado-carga__spinner" aria-hidden="true" />
    <p>{{ texto }}</p>
  </div>
</template>

<script setup>
defineProps({
  texto: { type: String, default: 'Cargando información…' }
})
</script>

<style scoped>
.estado-carga {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-16);
  padding: var(--esp-48) var(--esp-24);
  color: var(--texto-secundario);
  text-align: center;
}

.estado-carga__spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid var(--azul-200);
  border-top-color: var(--azul-500);
  animation: estado-carga-girar 0.9s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .estado-carga__spinner { animation: none; }
}

@keyframes estado-carga-girar {
  to { transform: rotate(360deg); }
}
</style>
