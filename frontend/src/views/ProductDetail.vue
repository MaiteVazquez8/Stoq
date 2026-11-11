<template>
  <div v-if="producto" class="pila--24">
    <PageHeader
      :titulo="producto.nombre"
      :subtitulo="`${producto.codigo} · ${producto.categoria_nombre || 'Sin categoría'} · ${producto.unidad_medida || 'Unidad'}`"
    >
      <template #acciones>
        <Button @click="irRegistrarMovimiento">Registrar movimiento</Button>
      </template>
    </PageHeader>

    <section class="panel destacado">
      <p class="destacado__stock">{{ formatUnidadesLargas(producto.stock_actual) }}</p>

      <p class="destacado__estado">
        <Badge :estado="estado" />
        <span v-if="!producto.activo" class="etiqueta-inactivo">Inactivo</span>
        <span class="texto-secundario">· Mínimo: {{ formatUnidades(producto.stock_minimo) }}</span>
      </p>

      <p class="destacado__detalle">{{ detalleStock }}</p>

      <p v-if="producto.descripcion" class="texto-cuerpo">{{ producto.descripcion }}</p>

      <p class="texto-meta">
        Precio: {{ formatPrecio(producto.precio) }} ·
        Creado el {{ formatFechaConMes(producto.fecha_creacion) }} ·
        Último movimiento: {{ ultimoMovimiento }}
      </p>

      <div v-if="esAdmin" class="acciones-destacadas">
        <RouterLink class="enlace-accion" :to="{ name: 'producto-editar', params: { id: producto.id_producto } }">
          Editar producto
          <Icon nombre="flecha-derecha" :tamano="16" />
        </RouterLink>
        <button type="button" class="enlace-accion enlace-boton" @click="solicitarAlternarActivo">
          {{ producto.activo ? 'Desactivar producto' : 'Reactivar producto' }}
          <Icon :nombre="producto.activo ? 'equis' : 'check'" :tamano="16" />
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__cabecera">
        <h3 class="panel-titulo">Evolución de existencias</h3>
        <p class="grafico__leyenda">
          <span class="grafico__leyenda-item">
            <span class="grafico__marca grafico__marca--punto"></span>
            Existencias · unidades · {{ rangoTexto }}
          </span>
        </p>
      </div>

      <LineChart
        v-if="serie.valores.length"
        :valores="serie.valores"
        :etiquetas="serie.etiquetas"
        :altura="200"
        :descripcion="`Evolución de existencias de ${producto.nombre}`"
      />
      <LoadingState v-else texto="Cargando evolución…" />
    </section>

    <section class="panel">
      <div class="panel__cabecera">
        <h3 class="panel-titulo">Movimientos de {{ producto.codigo }}</h3>
      </div>

      <MovementTable v-if="movimientos.length" :movimientos="movimientos" compacto />

      <EmptyState
        v-else
        icono="movimientos"
        titulo="Sin movimientos registrados"
        texto="Cuando registres una entrada o una salida vas a poder verla acá."
      />

      <div class="panel__pie">
        <RouterLink
          class="enlace-accion"
          :to="{ name: 'movimientos', query: { producto: producto.id_producto } }"
        >
          Consultar historial de este producto
          <Icon nombre="flecha-derecha" :tamano="16" />
        </RouterLink>
      </div>
    </section>

    <ConfirmModal
      :abierto="modalAbierto"
      :titulo="`¿${producto.activo ? 'Desactivar' : 'Reactivar'} producto?`"
      :texto-confirmar="producto.activo ? 'Desactivar' : 'Reactivar'"
      texto-procesando="Aplicando…"
      :procesando="procesandoModal"
      @cancelar="modalAbierto = false"
      @confirmar="confirmarAlternarActivo"
    >
      <p>
        {{ producto.activo
          ? `Vas a desactivar “${producto.nombre}”. Dejará de aparecer en los formularios de movimiento, pero se conserva todo su historial.`
          : `Vas a reactivar “${producto.nombre}”. Volverá a estar disponible en el catálogo y en los movimientos.` }}
      </p>
    </ConfirmModal>
  </div>

  <LoadingState v-else-if="cargando" texto="Cargando producto…" />

  <EmptyState
    v-else
    icono="buscar"
    titulo="No encontramos el producto"
    texto="El producto que buscás no existe o fue dado de baja."
  >
    <template #acciones>
      <Button variante="secundario" @click="volverAProductos">Volver a productos</Button>
    </template>
  </EmptyState>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import LineChart from '@/components/common/LineChart.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { findProduct, isAdmin, desactivarProducto, activarProducto } from '@/services/store'
import { estadoStock, movimientosDeProducto, serieExistencias, etiquetaRango } from '@/services/analytics'
import { formatFechaConMes, formatFechaHoraCorta, formatPrecio, formatUnidades, formatUnidadesLargas } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const producto = ref(null)
const movimientos = ref([])
const serie = ref({ valores: [], etiquetas: [] })

const cargando = ref(true)
const modalAbierto = ref(false)
const procesandoModal = ref(false)

const esAdmin = computed(() => isAdmin.value)
const estado = computed(() => estadoStock(producto.value))
const rangoTexto = computed(() => etiquetaRango())

const cargar = async () => {
  cargando.value = true

  const encontrado = await findProduct(route.params.id)
  producto.value = encontrado

  if (encontrado) {
    const [movs, serieResp] = await Promise.all([
      movimientosDeProducto(encontrado.id_producto),
      serieExistencias(encontrado.id_producto)
    ])
    movimientos.value = movs.slice(0, 5)
    serie.value = serieResp
  }

  cargando.value = false
}

onMounted(cargar)

const ultimoMovimiento = computed(() => {
  const ultimo = movimientos.value[0]
  if (!ultimo) return 'sin movimientos'
  return formatFechaHoraCorta(ultimo.fecha_hora)
})

const detalleStock = computed(() => {
  if (!producto.value) return ''
  if (estado.value === 'agotado') {
    return 'Sin unidades disponibles. Registrá una entrada para volver a tener stock.'
  }
  if (estado.value === 'bajo') {
    const faltante = producto.value.stock_minimo - producto.value.stock_actual
    return `Faltan ${formatUnidades(faltante)} para alcanzar el mínimo.`
  }
  const excedente = producto.value.stock_actual - producto.value.stock_minimo
  return `${formatUnidadesLargas(excedente)} por encima del mínimo.`
})

const irRegistrarMovimiento = () =>
  router.push({ name: 'movimiento-registrar', query: { producto: producto.value.id_producto } })

const volverAProductos = () => router.push({ name: 'productos' })

const solicitarAlternarActivo = () => {
  modalAbierto.value = true
}

const confirmarAlternarActivo = async () => {
  if (!producto.value) return

  procesandoModal.value = true

  const resultado = producto.value.activo
    ? await desactivarProducto(producto.value.id_producto)
    : await activarProducto(producto.value.id_producto)

  procesandoModal.value = false
  modalAbierto.value = false

  if (resultado.success) {
    await cargar()
  }
}
</script>

<style scoped>
.destacado {
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
}

.destacado__stock { font-size: 36px; font-weight: 600; }
.destacado__estado { display: flex; align-items: center; gap: var(--esp-8); }
.destacado__detalle { color: var(--texto-secundario); }

.acciones-destacadas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-16);
  align-items: center;
}

.enlace-boton {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: inherit;
}

.etiqueta-inactivo {
  display: inline-block;
  padding: 2px var(--esp-8);
  border-radius: var(--radio-control);
  border: 1px solid var(--n-400);
  color: var(--texto-secundario);
  font-size: 11px;
}

.panel__cabecera {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  margin-bottom: var(--esp-16);
}

.panel__pie { margin-top: var(--esp-16); }
</style>
