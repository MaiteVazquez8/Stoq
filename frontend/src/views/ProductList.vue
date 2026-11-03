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
    </div>

    <p class="texto-secundario">{{ resumenListado }}</p>

    <div v-if="productosFiltrados.length" class="panel">
      <ProductTable
        :productos="productosDeLaPagina"
        @ver="irDetalle"
        @editar="irEditar"
        @movimiento="irMovimiento"
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Input from '@/components/common/Input.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import Pagination from '@/components/common/Pagination.vue'
import ProductTable from '@/components/products/ProductTable.vue'
import { estadoStock } from '@/services/analytics'
import { getProducts, getCategories, isAdmin } from '@/services/store'

const router = useRouter()

const POR_PAGINA = 6

const OPCIONES_STOCK = [
  { valor: 'todos', texto: 'Todos los estados' },
  { valor: 'suficiente', texto: 'Suficiente' },
  { valor: 'bajo', texto: 'Stock bajo' },
  { valor: 'agotado', texto: 'Agotado' }
]

const productos = computed(() => getProducts())
const esAdmin = computed(() => isAdmin.value)

const busqueda = ref('')
const filtroCategoria = ref('todos')
const filtroStock = ref('todos')
const pagina = ref(1)

const opcionesCategorias = computed(() => [
  { valor: 'todos', texto: 'Todas las categorías' },
  ...getCategories().map(categoria => ({ valor: String(categoria.id_categoria), texto: categoria.nombre }))
])

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return productos.value.filter(producto => {
    const coincideTexto =
      !texto ||
      producto.nombre.toLowerCase().includes(texto) ||
      producto.codigo.toLowerCase().includes(texto)

    const coincideCategoria =
      filtroCategoria.value === 'todos' ||
      producto.id_categoria === Number(filtroCategoria.value)

    const coincideStock =
      filtroStock.value === 'todos' || estadoStock(producto) === filtroStock.value

    return coincideTexto && coincideCategoria && coincideStock
  })
})

const totalPaginas = computed(() => Math.max(Math.ceil(productosFiltrados.value.length / POR_PAGINA), 1))

const productosDeLaPagina = computed(() => {
  const inicio = (pagina.value - 1) * POR_PAGINA
  return productosFiltrados.value.slice(inicio, inicio + POR_PAGINA)
})

const desde = computed(() => (productosFiltrados.value.length ? (pagina.value - 1) * POR_PAGINA + 1 : 0))
const hasta = computed(() => Math.min(pagina.value * POR_PAGINA, productosFiltrados.value.length))

const resumenListado = computed(() => {
  const total = productos.value.length
  const suficientes = productos.value.filter(p => estadoStock(p) === 'suficiente').length
  const bajos = productos.value.filter(p => estadoStock(p) === 'bajo').length
  const agotados = productos.value.filter(p => estadoStock(p) === 'agotado').length
  return `${total} productos · ${suficientes} suficientes · ${bajos} con stock bajo · ${agotados} agotado`
})

watch([busqueda, filtroCategoria, filtroStock], () => {
  pagina.value = 1
})

const cambiarPagina = (nueva) => {
  pagina.value = nueva
}

const limpiarFiltros = () => {
  busqueda.value = ''
  filtroCategoria.value = 'todos'
  filtroStock.value = 'todos'
}

const irNuevo = () => router.push({ name: 'producto-nuevo' })
const irDetalle = (producto) => router.push({ name: 'producto-detalle', params: { id: producto.id_producto } })
const irEditar = (producto) => router.push({ name: 'producto-editar', params: { id: producto.id_producto } })
const irMovimiento = (producto) =>
  router.push({ name: 'movimiento-registrar', query: { producto: producto.id_producto } })
</script>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--esp-16);
}

@media (max-width: 900px) {
  .filtros { grid-template-columns: minmax(0, 1fr); }
}
</style>
