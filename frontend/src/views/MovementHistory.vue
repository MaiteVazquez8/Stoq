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
        <span class="resumen__neto">Neto {{ signoNeto }}{{ formatUnidades(Math.abs(totales.neto)) }}</span>
      </p>
    </section>

    <div class="filtros">
      <Input
        v-model="busqueda"
        etiqueta="Buscar"
        nombre="buscar-movimiento"
        placeholder="Producto, motivo o responsable…"
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

      <template v-if="periodo === 'personalizado'">
        <Input
          v-model="desde"
          etiqueta="Desde"
          nombre="filtrar-desde"
          type="date"
          :error="errorFechas"
        />

        <Input
          v-model="hasta"
          etiqueta="Hasta"
          nombre="filtrar-hasta"
          type="date"
        />
      </template>

      <Input
        v-model="responsable"
        etiqueta="Responsable"
        nombre="filtrar-responsable"
        tipo="select"
        :opciones="opcionesResponsables"
      />

      <Input
        v-model="orden"
        etiqueta="Orden"
        nombre="ordenar-movimientos"
        tipo="select"
        :opciones="OPCIONES_ORDEN"
      />
    </div>

    <p v-if="productoId" class="fila fila--separada texto-secundario">
      <span>Filtrado por producto · {{ nombreProductoFiltro }}</span>
      <button type="button" class="enlace-accion boton-enlace" @click="quitarFiltroProducto">Quitar filtro</button>
    </p>

    <p class="fila fila--separada texto-secundario">
      <span>{{ movimientosFiltrados.length }} {{ movimientosFiltrados.length === 1 ? 'registro' : 'registros' }} · Más recientes primero</span>
      <button type="button" class="enlace-accion boton-enlace" @click="limpiarFiltros">Limpiar filtros</button>
    </p>

    <Alert v-if="mensajeError" tipo="error" titulo="No pudimos cargar el historial" :mensaje="mensajeError" />

    <LoadingState v-if="cargando" texto="Cargando movimientos…" />

    <section v-else-if="movimientosFiltrados.length" class="panel">
      <MovementTable :movimientos="movimientosDeLaPagina" />

      <Pagination
        :total="movimientosFiltrados.length"
        :desde="desdeCalc"
        :hasta="hastaCalc"
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

    <p class="texto-meta">El historial es de solo lectura: los movimientos confirmados no se modifican ni se eliminan desde la aplicación.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import Pagination from '@/components/common/Pagination.vue'
import Alert from '@/components/common/Alert.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'
import { filtrarHistorial, getResponsables, calcularTotales } from '@/services/movements'
import { productosCompartidos, cargarProductos } from '@/services/store'
import { etiquetaRango } from '@/services/analytics'
import { formatUnidades } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const POR_PAGINA = 6

const OPCIONES_TIPO = [
  { valor: 'todos', texto: 'Todos los tipos' },
  { valor: 'Entrada', texto: 'Entradas' },
  { valor: 'Salida', texto: 'Salidas' }
]

const OPCIONES_ORDEN = [
  { valor: 'desc', texto: 'Más recientes primero' },
  { valor: 'asc', texto: 'Más antiguos primero' }
]

const busqueda = ref('')
const tipo = ref('todos')
const periodo = ref('periodo')
const desde = ref('')
const hasta = ref('')
const responsable = ref('todos')
const orden = ref('desc')
const productoId = ref(route.query.producto ? Number(route.query.producto) : null)
const pagina = ref(1)

const movimientosFiltrados = ref([])
const responsables = ref([])
const cargando = ref(true)
const mensajeError = ref('')

let recargaPendiente = null

const opcionesPeriodo = computed(() => [
  { valor: 'periodo', texto: `Período: ${etiquetaRango()}` },
  { valor: 'todo', texto: 'Todo el historial' },
  { valor: 'personalizado', texto: 'Elegir fechas…' }
])

const opcionesResponsables = computed(() => [
  { valor: 'todos', texto: 'Todos los responsables' },
  ...responsables.value.map(u => ({ valor: u.id_usuario, texto: u.nombre }))
])

const errorFechas = computed(() =>
  periodo.value === 'personalizado' && desde.value && hasta.value && desde.value > hasta.value
    ? 'La fecha inicial no puede ser posterior a la final.'
    : ''
)

const totales = computed(() => calcularTotales(movimientosFiltrados.value))
const signoNeto = computed(() => (totales.value.neto >= 0 ? '+' : '–'))

const productoSeleccionado = computed(
  () => productosCompartidos.value.find(p => p.id_producto === productoId.value) || null
)
const nombreProductoFiltro = computed(() => productoSeleccionado.value?.nombre || `Producto #${productoId.value}`)

const totalPaginas = computed(() => Math.max(Math.ceil(movimientosFiltrados.value.length / POR_PAGINA), 1))

const movimientosDeLaPagina = computed(() => {
  const inicio = (pagina.value - 1) * POR_PAGINA
  return movimientosFiltrados.value.slice(inicio, inicio + POR_PAGINA)
})

const desdeCalc = computed(() => (movimientosFiltrados.value.length ? (pagina.value - 1) * POR_PAGINA + 1 : 0))
const hastaCalc = computed(() => Math.min(pagina.value * POR_PAGINA, movimientosFiltrados.value.length))

const rangoFechas = () => {
  if (periodo.value === 'periodo') {
    const hoy = new Date()
    const inicio = new Date(hoy)
    inicio.setDate(hoy.getDate() - 6)
    const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { desde: aISO(inicio), hasta: aISO(hoy) }
  }
  if (periodo.value === 'personalizado') {
    return { desde: desde.value || null, hasta: hasta.value || null }
  }
  return { desde: null, hasta: null }
}

const cargar = async () => {
  if (errorFechas.value) return

  cargando.value = true
  mensajeError.value = ''

  const { desde: d, hasta: h } = rangoFechas()

  const { data, error } = await filtrarHistorial({
    busqueda: busqueda.value,
    tipo: tipo.value,
    desde: d,
    hasta: h,
    idProducto: productoId.value,
    idResponsable: responsable.value,
    orden: orden.value,
    limite: 500
  })

  if (error) {
    mensajeError.value = 'Revisá tu conexión o los filtros aplicados. Si el problema sigue, avisá al administrador.'
    movimientosFiltrados.value = []
  } else {
    movimientosFiltrados.value = data ?? []
  }

  cargando.value = false
}

// Reacarga con debounce al cambiar filtros de texto
const programarRecarga = () => {
  if (recargaPendiente) clearTimeout(recargaPendiente)
  recargaPendiente = setTimeout(() => {
    pagina.value = 1
    cargar()
  }, 250)
}

watch([busqueda, tipo, periodo, desde, hasta, responsable, orden], programarRecarga)

watch(
  () => route.query.producto,
  (valor) => {
    productoId.value = valor ? Number(valor) : null
    pagina.value = 1
    cargar()
  }
)

onMounted(async () => {
  cargando.value = true
  await Promise.all([cargar(), cargarProductos()])
  const { data } = await getResponsables()
  responsables.value = data ?? []
  cargando.value = false
})

const cambiarPagina = (nueva) => {
  pagina.value = nueva
}

const limpiarFiltros = () => {
  busqueda.value = ''
  tipo.value = 'todos'
  periodo.value = 'periodo'
  desde.value = ''
  hasta.value = ''
  responsable.value = 'todos'
  orden.value = 'desc'
  productoId.value = null
  pagina.value = 1

  if (route.query.producto) {
    router.replace({ name: 'movimientos' })
  }
}

const quitarFiltroProducto = () => {
  productoId.value = null
  pagina.value = 1
  if (route.query.producto) {
    router.replace({ name: 'movimientos' })
  }
  cargar()
}

const irRegistrarMovimiento = () => router.push({ name: 'movimiento-registrar' })
</script>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(5, minmax(0, 1fr));
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

@media (max-width: 1200px) {
  .filtros { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .filtros { grid-template-columns: minmax(0, 1fr); }
}
</style>
