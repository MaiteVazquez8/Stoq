<template>
  <div class="pila--24">
    <PageHeader
      titulo="Todo tu stock, en claro"
      :subtitulo="`Buen día, ${nombreUsuario}. Este es el resumen de ${negocio.nombre}. ${negocio.ultimosDias}.`"
    >
      <template #acciones>
        <Button @click="irRegistrarMovimiento">Registrar movimiento</Button>
      </template>
    </PageHeader>

    <div class="metricas">
      <StatCard
        etiqueta="Productos"
        :valor="resumen.totalProductos"
        :contexto="`${resumen.totalCategorias} categorías`"
      />
      <StatCard
        etiqueta="Unidades en stock"
        :valor="resumen.totalUnidades"
        :contexto="`${signoNeto} en 7 días`"
      />
      <StatCard
        etiqueta="Con stock bajo"
        :valor="resumen.stockBajo"
        contexto="Revisá los mínimos"
      />
      <StatCard
        etiqueta="Agotado"
        :valor="resumen.agotados"
        contexto="Necesita reposición"
      />
    </div>

    <Alert
      v-if="productosAtencion.length"
      tipo="info"
      :titulo="`${productosAtencion.length} ${productosAtencion.length === 1 ? 'producto necesita' : 'productos necesitan'} atención`"
      :mensaje="detalleAtencion"
    />

    <div class="grilla-dos grilla-dos--amplia">
      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Evolución del stock</h3>
          <p class="grafico__leyenda">
            <span class="grafico__leyenda-item">
              <span class="grafico__marca grafico__marca--punto"></span>
              Existencias · unidades · {{ negocio.periodo }}
            </span>
          </p>
        </div>

        <LineChart
          :valores="serie.valores"
          :etiquetas="serie.etiquetas"
          :altura="220"
          descripcion="Evolución de las existencias en los últimos 7 días"
        />
      </section>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Entradas y salidas</h3>
          <p class="grafico__leyenda">
            <span class="grafico__leyenda-item">
              <span class="grafico__marca"></span>
              Entradas +{{ resumen.entradas }}
            </span>
            <span class="grafico__leyenda-item">
              <span class="grafico__marca grafico__marca--hueca"></span>
              Salidas –{{ resumen.salidas }} · unidades
            </span>
          </p>
        </div>

        <BarChart
          :entradas="barras.entradas"
          :salidas="barras.salidas"
          :etiquetas="barras.etiquetas"
          :altura="200"
        />

        <div class="grafico__pie">
          <p class="grafico__titulo-pie">Día: entrada / salida</p>
          <p>{{ detalleBarras }}</p>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel__cabecera">
        <h3 class="panel-titulo">Últimos movimientos</h3>
      </div>

      <MovementTable v-if="movimientos.length" :movimientos="movimientos" compacto />

      <EmptyState
        v-else
        icono="movimientos"
        titulo="Todavía no hay movimientos"
        texto="Cuando registres una entrada o una salida, la vas a ver acá."
      />

      <div class="panel__pie">
        <RouterLink class="enlace-accion" :to="{ name: 'movimientos' }">
          Ver todo el historial
          <Icon nombre="flecha-derecha" :tamano="16" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import LineChart from '@/components/common/LineChart.vue'
import BarChart from '@/components/common/BarChart.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import { getCurrentUser } from '@/services/store'
import {
  entradasSalidasPorDia,
  movimientosRecientes,
  productosQueNecesitanAtencion,
  resumenInventario,
  serieExistencias
} from '@/services/analytics'
import { negocio } from '@/data/business'

const router = useRouter()

const resumen = computed(() => resumenInventario())
const serie = computed(() => serieExistencias())
const barras = computed(() => entradasSalidasPorDia())
const movimientos = computed(() => movimientosRecientes(5))
const productosAtencion = computed(() => productosQueNecesitanAtencion())

const nombreUsuario = computed(() => getCurrentUser()?.nombre?.split(' ')[0] || 'de nuevo')
const signoNeto = computed(() => (resumen.value.neto >= 0 ? `+${resumen.value.neto}` : `${resumen.value.neto}`))

const detalleAtencion = computed(() => {
  const { stockBajo, agotados } = resumen.value
  const partes = []
  if (stockBajo) partes.push(`${stockBajo} con stock bajo`)
  if (agotados) partes.push(`${agotados} ${agotados === 1 ? 'agotado' : 'agotados'}`)
  return `${partes.join(' y ')}. Revisá los mínimos para planificar tu próxima reposición.`
})

const detalleBarras = computed(() =>
  barras.value.detalle
    .map(item => `${item.dia}: ${item.entrada}/${item.salida}`)
    .join(' · ')
)

const irRegistrarMovimiento = () => router.push({ name: 'movimiento-registrar' })
</script>

<style scoped>
.panel__cabecera {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  margin-bottom: var(--esp-16);
}

.panel__pie { margin-top: var(--esp-16); }
</style>
