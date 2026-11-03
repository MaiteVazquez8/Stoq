<template>
  <div ref="elemento" class="grafico">
    <svg
      :viewBox="`0 0 ${ancho} ${altura}`"
      :height="altura"
      class="grafico__svg"
      role="img"
      :aria-label="descripcion"
    >
      <g class="grafico__ejes">
        <text
          v-for="tick in ticks"
          :key="tick"
          :x="MARGEN_IZQ - 10"
          :y="escalaY(tick) + 4"
          text-anchor="end"
        >
          {{ tick }}
        </text>
      </g>

      <g v-for="(etiqueta, indice) in etiquetas" :key="etiqueta">
        <rect
          :x="escalaX(indice) - anchoGrupo / 2"
          :y="escalaY(entradas[indice])"
          :width="Math.max(anchoGrupo / 2 - 2, 1)"
          :height="Math.max(altura - MARGEN_INF - escalaY(entradas[indice]), 0)"
          rx="2"
          class="grafico__barra-entrada"
        />
        <rect
          :x="escalaX(indice) + 2"
          :y="escalaY(salidas[indice])"
          :width="Math.max(anchoGrupo / 2 - 2, 1)"
          :height="Math.max(altura - MARGEN_INF - escalaY(salidas[indice]), 0)"
          rx="2"
          class="grafico__barra-salida"
        />
      </g>
    </svg>

    <div class="grafico__eje-x">
      <span v-for="etiqueta in etiquetas" :key="`eje-${etiqueta}`">{{ etiqueta }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAnchoElemento } from '@/utils/useAnchoElemento'

const props = defineProps({
  entradas: { type: Array, required: true },
  salidas: { type: Array, required: true },
  etiquetas: { type: Array, required: true },
  altura: { type: Number, default: 180 },
  descripcion: { type: String, default: 'Gráfico de entradas y salidas por día' }
})

const { elemento, ancho } = useAnchoElemento()

const MARGEN_IZQ = 48
const MARGEN_DER = 24
const MARGEN_SUP = 16
const MARGEN_INF = 16

const maximo = computed(() => {
  const mayor = Math.max(...props.entradas, ...props.salidas, 1)
  const paso = Math.max(Math.pow(10, Math.floor(Math.log10(mayor))) / 2, 1)
  return Math.ceil(mayor / paso) * paso
})

const ticks = computed(() => [maximo.value, Math.round(maximo.value / 2), 0])

const anchoGrupo = computed(() => {
  const pasos = Math.max(props.etiquetas.length, 1)
  return (ancho.value - MARGEN_IZQ - MARGEN_DER) / pasos
})

const escalaX = (indice) => MARGEN_IZQ + anchoGrupo.value * (indice + 0.5)

const escalaY = (valor) => {
  const proporcion = valor / (maximo.value || 1)
  return props.altura - MARGEN_INF - proporcion * (props.altura - MARGEN_SUP - MARGEN_INF)
}
</script>

<style scoped>
.grafico {
  width: 100%;
  min-width: 0;
}

.grafico__svg {
  width: 100%;
  display: block;
}

.grafico__ejes text {
  font-size: 11px;
  fill: var(--texto-tenue);
  font-family: var(--fuente);
}

.grafico__barra-entrada {
  fill: var(--azul-500);
}

.grafico__barra-salida {
  fill: var(--superficie);
  stroke: var(--n-800);
  stroke-width: 1;
}

.dark .grafico__barra-salida {
  stroke: #A3A3A3;
}

.grafico__eje-x {
  display: flex;
  justify-content: space-around;
  padding-left: 40px;
  font-size: 12px;
  color: var(--texto-tenue);
}
</style>
