<template>
  <div class="estado-vacio">
    <Icon class="estado-vacio__icono" :nombre="icono" :tamano="28" />
    <p class="estado-vacio__titulo">{{ titulo }}</p>
    <p class="estado-vacio__texto">{{ texto }}</p>
    <div v-if="$slots.acciones" class="estado-vacio__acciones">
      <slot name="acciones" />
    </div>
  </div>
</template>

<script setup>
import Icon from '@/components/common/Icon.vue'

defineProps({
  icono: { type: String, default: 'caja' },
  titulo: { type: String, required: true },
  texto: { type: String, default: '' }
})
</script>
