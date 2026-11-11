<template>
  <div class="pila--24">
    <PageHeader
      titulo="Productos"
      subtitulo="Buscá, revisá y mantené tu catálogo al día."
    >
      <template v-if="esAdmin" #acciones>
        <Button @click="irNuevo">+ Nuevo producto</Button>
      </template>
    </PageHeader>

    <div class="filtros">
      <Input
        v-model="busqueda"
        etiqueta="Buscar"
        nombre="buscar-producto"
        placeholder="Nombre o SKU…"
      />

      <Input
        v-model="filtroCategoria"
        etiqueta="Categoría"
        nombre="filtrar-categoria"
        tipo="select"
        :opciones="opcionesCategorias"
      />

      <Input
        v-model="filtroStock"
        etiqueta="Estado de stock"
        nombre="filtrar-stock"
        tipo="select"
        :opciones="OPCIONES_STOCK"
      />

      <Input
        v-model="filtroActivo"
        etiqueta="Estado del producto"
        nombre="filtrar-activo"
        tipo="select"
        :opciones="OPCIONES_ACTIVO"
      />

      <Input
        v-model="orden"
        etiqueta="Ordenar por"
        nombre="ordenar-producto"
        tipo="select"
        :opciones="OPCIONES_ORDEN"
      />
    </div>

    <p class="texto-secundario">{{ resumenListado }}</p>

    <Alert v-if="mensajeExito" tipo="exito" titulo="Cambio aplicado" :mensaje="mensajeExito" />
    <Alert v-if="mensajeError" tipo="error" titulo="No pudimos actualizar los productos" :mensaje="mensajeError" />

    <LoadingState v-if="cargando" texto="Cargando productos…" />

    <div v-else-if="productosFiltrados.length" class="panel">
      <ProductTable
        :productos="productosDeLaPagina"
        @ver="irDetalle"
        @editar="irEditar"
        @movimiento="irMovimiento"
        @alternar-activo="solicitarAlternarActivo"
      />

      <Pagination
        :total="productosFiltrados.length"
        :desde="desde"
        :hasta="hasta"
        :pagina="pagina"
        :total-paginas="totalPaginas"
        unidad="productos"
        @cambiar="cambiarPagina"
      />
    </div>

    <EmptyState
      v-else-if="!productos.length"
      icono="caja"
      titulo="Tu catálogo empieza acá"
      texto="Creá tu primer producto para empezar a ordenar tu stock."
    >
      <template v-if="esAdmin" #acciones>
        <Button @click="irNuevo">+ Nuevo producto</Button>
      </template>
    </EmptyState>

    <EmptyState
      v-else
      icono="buscar"
      titulo="No encontramos productos"
      texto="Probá con otro nombre o limpiá los filtros."
    >
      <template #acciones>
        <Button variante="secundario" @click="limpiarFiltros">Limpiar filtros</Button>
      </template>
    </EmptyState>

    <ConfirmModal
      :abierto="modalAbierto"
      :titulo="`¿${productoPendiente?.activo ? 'Desactivar' : 'Reactivar'} producto?`"
      :texto-confirmar="productoPendiente?.activo ? 'Desactivar' : 'Reactivar'"
      texto-procesando="Aplicando…"
      :procesando="procesandoModal"
      @cancelar="modalAbierto = false"
      @confirmar="confirmarAlternarActivo"
    >
      <p>
        {{ productoPendiente?.activo
          ? `Vas a desactivar “${productoPendiente?.nombre}”. Dejará de aparecer en los formularios de movimiento, pero se conserva todo su historial.`
          : `Vas a reactivar “${productoPendiente?.nombre}”. Volverá a estar disponible en el catálogo y en los movimientos.` }}
      </p>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Input from '@/components/common/Input.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import Pagination from '@/components/common/Pagination.vue'
import ProductTable from '@/components/products/ProductTable.vue'
import { estadoStock } from '@/services/analytics'
import {
  productosCompartidos,
  categoriasCompartidas,
  cargarProductos,
  cargarCategorias,
  desactivarProducto,
  activarProducto,
  isAdmin
} from '@/services/store'

const router = useRouter()

const POR_PAGINA = 6

const OPCIONES_STOCK = [
  { valor: 'todos', texto: 'Todos los estados' },
  { valor: 'suficiente', texto: 'Suficiente' },
  { valor: 'bajo', texto: 'Stock bajo' },
  { valor: 'agotado', texto: 'Agotado' }
]

const OPCIONES_ACTIVO = [
  { valor: 'activos', texto: 'Solo activos' },
  { valor: 'inactivos', texto: 'Solo inactivos' },
  { valor: 'todos', texto: 'Todos' }
]

const OPCIONES_ORDEN = [
  { valor: 'nombre-asc', texto: 'Nombre (A–Z)' },
  { valor: 'precio-asc', texto: 'Precio (menor a mayor)' },
  { valor: 'precio-desc', texto: 'Precio (mayor a menor)' },
  { valor: 'stock-desc', texto: 'Stock (mayor a menor)' },
  { valor: 'stock-asc', texto: 'Stock (menor a mayor)' }
]

const productos = productosCompartidos
const categorias = categoriasCompartidas
const cargando = ref(true)
const mensajeError = ref('')
const mensajeExito = ref('')

const esAdmin = computed(() => isAdmin.value)

const busqueda = ref('')
const filtroCategoria = ref('todos')
const filtroStock = ref('todos')
const filtroActivo = ref('activos')
const orden = ref('nombre-asc')
const pagina = ref(1)

const modalAbierto = ref(false)
const procesandoModal = ref(false)
const productoPendiente = ref(null)

const opcionesCategorias = computed(() => [
  { valor: 'todos', texto: 'Todas las categorías' },
  ...categorias.value.map(categoria => ({ valor: String(categoria.id_categoria), texto: categoria.nombre }))
])

const productosBase = computed(() => {
  if (filtroActivo.value === 'todos') return productos.value
  return productos.value.filter(p => (filtroActivo.value === 'activos' ? p.activo : !p.activo))
})

const comparador = computed(() => {
  const [campo, direccion] = orden.value.split('-')
  const signo = direccion === 'asc' ? 1 : -1

  if (campo === 'precio') return (a, b) => (Number(a.precio) - Number(b.precio)) * signo
  if (campo === 'stock') return (a, b) => (Number(a.stock_actual) - Number(b.stock_actual)) * signo
  return (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es') * signo
})

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return productosBase.value
    .filter(producto => {
      const coincideTexto =
        !texto ||
        String(producto.nombre).toLowerCase().includes(texto) ||
        String(producto.codigo).toLowerCase().includes(texto)

      const coincideCategoria =
        filtroCategoria.value === 'todos' ||
        producto.id_categoria === Number(filtroCategoria.value)

      const coincideStock =
        filtroStock.value === 'todos' ||
        (producto.estado_stock || estadoStock(producto)) === filtroStock.value

      return coincideTexto && coincideCategoria && coincideStock
    })
    .slice()
    .sort(comparador.value)
})

const totalPaginas = computed(() => Math.max(Math.ceil(productosFiltrados.value.length / POR_PAGINA), 1))

const productosDeLaPagina = computed(() => {
  const inicio = (pagina.value - 1) * POR_PAGINA
  return productosFiltrados.value.slice(inicio, inicio + POR_PAGINA)
})

const desde = computed(() => (productosFiltrados.value.length ? (pagina.value - 1) * POR_PAGINA + 1 : 0))
const hasta = computed(() => Math.min(pagina.value * POR_PAGINA, productosFiltrados.value.length))

const resumenListado = computed(() => {
  const activos = productos.value.filter(p => p.activo)
  const suficientes = activos.filter(p => (p.estado_stock || estadoStock(p)) === 'suficiente').length
  const bajos = activos.filter(p => (p.estado_stock || estadoStock(p)) === 'bajo').length
  const agotados = activos.filter(p => (p.estado_stock || estadoStock(p)) === 'agotado').length
  return `${activos.length} activos · ${suficientes} suficientes · ${bajos} con stock bajo · ${agotados} agotados`
})

watch([busqueda, filtroCategoria, filtroStock, filtroActivo, orden], () => {
  pagina.value = 1
})

onMounted(async () => {
  cargando.value = true
  const [productosResp] = await Promise.all([cargarProductos(), cargarCategorias()])

  if (productosResp.error) {
    mensajeError.value = 'Revisá tu conexión o volvé a intentarlo. Si el problema sigue, avisá al administrador.'
  }

  cargando.value = false
})

const cambiarPagina = (nueva) => {
  pagina.value = nueva
}

const limpiarFiltros = () => {
  busqueda.value = ''
  filtroCategoria.value = 'todos'
  filtroStock.value = 'todos'
  filtroActivo.value = 'activos'
  orden.value = 'nombre-asc'
}

const irNuevo = () => router.push({ name: 'producto-nuevo' })
const irDetalle = (producto) => router.push({ name: 'producto-detalle', params: { id: producto.id_producto } })
const irEditar = (producto) => router.push({ name: 'producto-editar', params: { id: producto.id_producto } })
const irMovimiento = (producto) =>
  router.push({ name: 'movimiento-registrar', query: { producto: producto.id_producto } })

const solicitarAlternarActivo = (producto) => {
  productoPendiente.value = producto
  modalAbierto.value = true
}

const confirmarAlternarActivo = async () => {
  const producto = productoPendiente.value
  if (!producto) return

  procesandoModal.value = true

  const resultado = producto.activo
    ? await desactivarProducto(producto.id_producto)
    : await activarProducto(producto.id_producto)

  procesandoModal.value = false
  modalAbierto.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    mensajeExito.value = ''
    return
  }

  mensajeError.value = ''
  mensajeExito.value = producto.activo
    ? `“${producto.nombre}” se desactivó. El historial se conserva.`
    : `“${producto.nombre}” se reactivó correctamente.`
}
</script>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(4, minmax(0, 1fr));
  gap: var(--esp-16);
}

@media (max-width: 1100px) {
  .filtros { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .filtros { grid-template-columns: minmax(0, 1fr); }
}
</style>
