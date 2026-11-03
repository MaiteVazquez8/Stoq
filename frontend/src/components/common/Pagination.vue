<template>
  <div class="paginacion">
    <span>{{ rangoTexto }}</span>

    <div v-if="totalPaginas > 1" class="paginacion__controles">
      <button
        type="button"
        class="paginacion__pagina"
        :disabled="pagina <= 1"
        aria-label="Página anterior"
        @click="cambiar(pagina - 1)"
      >
        <Icon nombre="chevron-izquierda" :tamano="14" />
      </button>

      <button
        v-for="numero in paginas"
        :key="numero"
        type="button"
        class="paginacion__pagina"
        :class="{ 'paginacion__pagina--activa': numero === pagina }"
        :aria-current="numero === pagina ? 'page' : undefined"
        @click="cambiar(numero)"
      >
        {{ numero }}
      </button>

      <button
        type="button"
        class="paginacion__pagina"
        :disabled="pagina >= totalPaginas"
        aria-label="Página siguiente"
        @click="cambiar(pagina + 1)"
      >
        <Icon nombre="chevron-derecha" :tamano="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/common/Icon.vue'

const props = defineProps({
  total: { type: Number, required: true },
  desde: { type: Number, required: true },
  hasta: { type: Number, required: true },
  pagina: { type: Number, default: 1 },
  totalPaginas: { type: Number, default: 1 },
  unidad: { type: String, default: 'registros' }
})

const emit = defineEmits(['cambiar'])

const rangoTexto = computed(() => {
  if (props.total === 0) return `0 ${props.unidad}`
  const base = `${props.desde}–${props.hasta} de ${props.total} ${props.unidad}`
  return props.totalPaginas > 1 ? `${base} · Página ${props.pagina} de ${props.totalPaginas}` : base
})

const paginas = computed(() =>
  Array.from({ length: props.totalPaginas }, (_, indice) => indice + 1)
)

const cambiar = (numero) => {
  if (numero < 1 || numero > props.totalPaginas || numero === props.pagina) return
  emit('cambiar', numero)
}
</script>
