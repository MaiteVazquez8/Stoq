<template>
  <div v-if="producto" class="pila--24">
    <PageHeader
      :titulo="producto.nombre"
      :subtitulo="`${producto.codigo} · ${getCategoryName(producto.id_categoria)} · ${producto.unidad_medida || 'Unidad'}`"
    >
      <template #acciones>
        <Button @click="irRegistrarMovimiento">Registrar movimiento</Button>
      </template>
    </PageHeader>

    <section class="panel destacado">
      <p class="destacado__stock">{{ formatUnidadesLargas(producto.stock_actual) }}</p>

      <p class="destacado__estado">
        <Badge :estado="estado" />
        <span class="texto-secundario">· Mínimo: {{ formatUnidades(producto.stock_minimo) }}</span>
      </p>

      <p class="destacado__detalle">{{ detalleStock }}</p>

      <p v-if="producto.descripcion" class="texto-cuerpo">{{ producto.descripcion }}</p>

      <p class="texto-meta">
        Precio: {{ formatPrecio(producto.precio) }} ·
        Creado el {{ formatFechaConMes(producto.fecha_creacion) }} ·
        Último movimiento: {{ ultimoMovimiento }}
      </p>

      <div v-if="esAdmin">
        <RouterLink class="enlace-accion" :to="{ name: 'producto-editar', params: { id: producto.id_producto } }">
          Editar producto
          <Icon nombre="flecha-derecha" :tamano="16" />
        </RouterLink>
      </div>
    </section>

    <section class="panel">
      <div class="panel__cabecera">
        <h3 class="panel-titulo">Evolución de existencias</h3>
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
        :altura="200"
        :descripcion="`Evolución de existencias de ${producto.nombre}`"
      />
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
  </div>

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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import LineChart from '@/components/common/LineChart.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { findProduct, isAdmin } from '@/services/store'
import { estadoStock, movimientosDeProducto, serieExistencias } from '@/services/analytics'
import { getCategoryName } from '@/data/categories'
import { formatFechaConMes, formatFechaHoraCorta, formatPrecio, formatUnidades, formatUnidadesLargas } from '@/utils/format'
import { negocio } from '@/data/business'

const route = useRoute()
const router = useRouter()

const producto = computed(() => findProduct(route.params.id))
const esAdmin = computed(() => isAdmin.value)

const estado = computed(() => estadoStock(producto.value))
const serie = computed(() => serieExistencias(producto.value?.id_producto))
const movimientos = computed(() =>
  producto.value ? movimientosDeProducto(producto.value.id_producto).slice(0, 5) : []
)

const ultimoMovimiento = computed(() => {
  const ultimo = movimientos.value[0]
  if (!ultimo) return 'sin movimientos'
  const esDeHoy = ultimo.fecha_hora.slice(0, 10) === negocio.hoy.slice(0, 10)
  return esDeHoy
    ? `hoy, ${formatFechaHoraCorta(ultimo.fecha_hora).split(' · ')[1] || ''}`
    : formatFechaHoraCorta(ultimo.fecha_hora)
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

.panel__cabecera {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  margin-bottom: var(--esp-16);
}

.panel__pie { margin-top: var(--esp-16); }
</style>
