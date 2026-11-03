<template>
  <div ref="elemento" class="grafico">
    <svg
      :viewBox="`0 0 ${ancho} ${altura}`"
      :height="altura"
      class="grafico__svg"
      role="img"
      :aria-label="descripcion"
    >
      <!-- eje de referencias -->
      <g class="grafico__ejes">
        <text
          v-for="tick in ticks"
          :key="tick.valor"
          :x="MARGEN_IZQ - 10"
          :y="escalaY(tick.valor) + 4"
          text-anchor="end"
        >
          {{ tick.valor }}
        </text>
      </g>

      <!-- serie -->
      <polyline
        v-if="valores.length"
        :points="puntos"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <circle
        v-if="valores.length"
        :cx="escalaX(valores.length - 1)"
        :cy="escalaY(valores[valores.length - 1])"
        r="3.5"
        :fill="color"
      />
    </svg>

    <div class="grafico__eje-x">
      <span>{{ etiquetas[0] }}</span>
      <span v-if="etiquetaFinal">{{ etiquetaFinal }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAnchoElemento } from '@/utils/useAnchoElemento'

const props = defineProps({
  valores: { type: Array, required: true },
  etiquetas: { type: Array, default: () => [] },
  altura: { type: Number, default: 180 },
  color: { type: String, default: 'var(--serie)' },
  unidad: { type: String, default: 'u.' },
  descripcion: { type: String, default: 'Gráfico de evolución de existencias' }
})

const { elemento, ancho } = useAnchoElemento()

const MARGEN_IZQ = 48
const MARGEN_DER = 24
const MARGEN_SUP = 16
const MARGEN_INF = 16

const rango = computed(() => {
  const valores = props.valores.length ? props.valores : [0, 1]
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const amplitud = Math.max(maximo - minimo, 1)
  const paso = Math.max(Math.pow(10, Math.floor(Math.log10(amplitud))) / 2, 1)
  const base = Math.floor(minimo / paso) * paso
  let tope = Math.ceil(maximo / paso) * paso
  if (tope === base) tope = base + paso * 2
  return { base, tope }
})

const ticks = computed(() => {
  const { base, tope } = rango.value
  const medio = Math.round((base + tope) / 2)
  return [{ valor: tope }, { valor: medio }, { valor: base }]
})

const escalaX = (indice) => {
  const pasos = Math.max(props.valores.length - 1, 1)
  return MARGEN_IZQ + (indice * (ancho.value - MARGEN_IZQ - MARGEN_DER)) / pasos
}

const escalaY = (valor) => {
  const { base, tope } = rango.value
  const proporcion = (valor - base) / (tope - base || 1)
  return props.altura - MARGEN_INF - proporcion * (props.altura - MARGEN_SUP - MARGEN_INF)
}

const puntos = computed(() =>
  props.valores.map((valor, indice) => `${escalaX(indice)},${escalaY(valor)}`).join(' ')
)

const etiquetaFinal = computed(() => {
  if (!props.etiquetas.length || !props.valores.length) return ''
  const ultima = props.etiquetas[props.etiquetas.length - 1]
  return `${ultima} · ${props.valores[props.valores.length - 1]} ${props.unidad}`
})
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

.grafico__eje-x {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--texto-tenue);
}
</style>
