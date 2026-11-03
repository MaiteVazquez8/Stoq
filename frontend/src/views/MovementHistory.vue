<template>
  <div class="pila--24">
    <PageHeader
      titulo="Historial de movimientos"
      subtitulo="Cada cambio tiene fecha, producto y motivo."
    >
      <template #acciones>
        <Button @click="irRegistrarMovimiento">Registrar movimiento</Button>
      </template>
    </PageHeader>

    <section class="panel resumen">
      <p class="resumen__totales">
        <span class="resumen__item">
          <Icon nombre="flecha-abajo" :tamano="16" />
          Entradas +{{ formatUnidades(totales.entradas) }}
        </span>
        <span class="resumen__item">
          <Icon nombre="flecha-arriba" :tamano="16" />
          Salidas –{{ formatUnidades(totales.salidas) }}
        </span>
        <span class="resumen__neto">Neto +{{ formatUnidades(totales.neto) }}</span>
      </p>
    </section>

    <div class="filtros">
      <Input
        v-model="busqueda"
        etiqueta="Buscar"
        nombre="buscar-movimiento"
        placeholder="Producto o motivo…"
      />

      <Input
        v-model="tipo"
        etiqueta="Tipo"
        nombre="filtrar-tipo"
        tipo="select"
        :opciones="OPCIONES_TIPO"
      />

      <Input
        v-model="periodo"
        etiqueta="Período"
        nombre="filtrar-periodo"
        tipo="select"
        :opciones="opcionesPeriodo"
      />
    </div>

    <p class="fila fila--separada texto-secundario">
      <span>Más recientes primero · {{ etiquetaProducto }}</span>
      <button type="button" class="enlace-accion boton-enlace" @click="limpiarFiltros">Limpiar filtros</button>
    </p>

    <section v-if="movimientos.length" class="panel">
      <MovementTable :movimientos="movimientosDeLaPagina" />

      <Pagination
        :total="movimientos.length"
        :desde="desde"
        :hasta="hasta"
        :pagina="pagina"
        :total-paginas="totalPaginas"
        unidad="registros"
        @cambiar="cambiarPagina"
      />
    </section>

    <EmptyState
      v-else
      icono="buscar"
      titulo="No encontramos movimientos"
      texto="Probá con otro producto o motivo, o limpiá los filtros."
    >
      <template #acciones>
        <Button variante="secundario" @click="limpiarFiltros">Limpiar filtros</Button>
      </template>
    </EmptyState>

    <p class="texto-meta">Los totales incluyen los {{ movimientosFiltrados.length }} registros del período, no solo esta página.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import Pagination from '@/components/common/Pagination.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'
import { findProduct } from '@/services/store'
import { filtrarHistorial, rangoPeriodo, totalesDe } from '@/services/analytics'
import { formatRangoFechas, formatUnidades } from '@/utils/format'
import { negocio } from '@/data/business'

const route = useRoute()
const router = useRouter()

const POR_PAGINA = 6

const OPCIONES_TIPO = [
  { valor: 'todos', texto: 'Todos los tipos' },
  { valor: 'Entrada', texto: 'Entradas' },
  { valor: 'Salida', texto: 'Salidas' }
]

const busqueda = ref('')
const tipo = ref('todos')
const periodo = ref('periodo')
const productoId = ref(route.query.producto ? Number(route.query.producto) : null)
const pagina = ref(1)

const opcionesPeriodo = computed(() => {
  const { desde, hasta } = rangoPeriodo()
  return [
    { valor: 'periodo', texto: `Período: ${formatRangoFechas(desde, hasta)}` },
    { valor: 'todo', texto: 'Todo el historial' }
  ]
})

const movimientosFiltrados = computed(() => {
  const { desde, hasta } = rangoPeriodo()
  const enPeriodo = periodo.value === 'periodo'

  return filtrarHistorial({
    busqueda: busqueda.value,
    tipo: tipo.value,
    desde: enPeriodo ? desde : null,
    hasta: enPeriodo ? hasta : null
  }).filter(movimiento => !productoId.value || movimiento.id_producto === productoId.value)
})

const movimientos = computed(() => movimientosFiltrados.value)
const totales = computed(() => totalesDe(movimientosFiltrados.value))

const totalPaginas = computed(() => Math.max(Math.ceil(movimientos.value.length / POR_PAGINA), 1))

const movimientosDeLaPagina = computed(() => {
  const inicio = (pagina.value - 1) * POR_PAGINA
  return movimientos.value.slice(inicio, inicio + POR_PAGINA)
})

const desde = computed(() => (movimientos.value.length ? (pagina.value - 1) * POR_PAGINA + 1 : 0))
const hasta = computed(() => Math.min(pagina.value * POR_PAGINA, movimientos.value.length))

const etiquetaProducto = computed(() => {
  if (!productoId.value) return 'Todos los productos'
  return findProduct(productoId.value)?.nombre || 'Producto no encontrado'
})

watch([busqueda, tipo, periodo, productoId], () => {
  pagina.value = 1
})

watch(
  () => route.query.producto,
  (valor) => {
    productoId.value = valor ? Number(valor) : null
  }
)

const cambiarPagina = (nueva) => {
  pagina.value = nueva
}

const limpiarFiltros = () => {
  busqueda.value = ''
  tipo.value = 'todos'
  periodo.value = 'periodo'
  productoId.value = null
  if (route.query.producto) {
    router.replace({ name: 'movimientos' })
  }
}

const irRegistrarMovimiento = () => router.push({ name: 'movimiento-registrar' })
</script>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--esp-16);
}

.resumen__totales {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--esp-24);
  font-size: 16px;
  color: var(--azul-500);
}

.resumen__item { display: inline-flex; align-items: center; gap: var(--esp-4); }
.resumen__neto { font-weight: 600; }

.boton-enlace {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 900px) {
  .filtros { grid-template-columns: minmax(0, 1fr); }
}
</style>
