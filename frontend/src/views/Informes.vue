<template>
  <div class="pila--24">
    <PageHeader
      titulo="Informes"
      subtitulo="Movimientos y existencias en el período. Solo administrador."
    />

    <div class="chips-periodo" role="tablist" aria-label="Período">
      <button
        v-for="preset in PRESETS"
        :key="preset.valor"
        type="button"
        role="tab"
        :aria-selected="periodo === preset.valor"
        class="chip-periodo"
        :class="{ 'chip-periodo--activo': periodo === preset.valor }"
        @click="aplicarPreset(preset.valor)"
      >
        {{ preset.etiqueta }}
      </button>
    </div>

    <div class="filtro-fechas">
      <Input
        v-model="desde"
        etiqueta="Desde"
        nombre="informe-desde"
        type="date"
        :error="errorFechas"
      />
      <Input
        v-model="hasta"
        etiqueta="Hasta"
        nombre="informe-hasta"
        type="date"
      />
    </div>

    <LoadingState v-if="cargando" texto="Calculando informe…" />

    <Alert
      v-else-if="mensajeError"
      tipo="error"
      titulo="No pudimos generar el informe"
      :mensaje="mensajeError"
    />

    <template v-else-if="datos">
      <div class="metricas">
        <StatCard etiqueta="Entradas" :valor="formatUnidades(datos.entradas)" contexto="Unidades recibidas" />
        <StatCard etiqueta="Salidas" :valor="formatUnidades(datos.salidas)" contexto="Unidades retiradas" />
        <StatCard :etiqueta="datos.neto >= 0 ? 'Neto positivo' : 'Neto negativo'" :valor="formatSigno(neto)" contexto="Entradas menos salidas" />
        <StatCard etiqueta="Movimientos" :valor="formatNumero(datos.movimientos)" contexto="Registros en el período" />
      </div>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Entradas y salidas por día</h3>
          <p class="grafico__leyenda">
            <span class="grafico__leyenda-item">
              <span class="grafico__marca"></span>
              Entradas +{{ datos.entradas }}
            </span>
            <span class="grafico__leyenda-item">
              <span class="grafico__marca grafico__marca--hueca"></span>
              Salidas –{{ datos.salidas }}
            </span>
          </p>
        </div>

        <BarChart
          v-if="datos.porDia.length"
          :entradas="entradasPorDia"
          :salidas="salidasPorDia"
          :etiquetas="etiquetasPorDia"
          :altura="220"
          descripcion="Entradas y salidas por día"
        />

        <EmptyState
          v-else
          icono="caja"
          titulo="Sin movimientos en el período"
          texto="Elegí otro período o registrá movimientos para ver el informe."
        />
      </section>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Productos con más movimiento en el período</h3>
        </div>

        <p v-if="!datos.porProducto.length" class="texto-secundario">
          No hay movimientos con productos asociados en este período.
        </p>
        <table v-else class="tabla">
          <thead>
            <tr>
              <th scope="col">Producto / SKU</th>
              <th scope="col" class="celda-numero">Entradas</th>
              <th scope="col" class="celda-numero">Salidas</th>
              <th scope="col" class="celda-numero">Neto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productosOrdenados" :key="p.id_producto">
              <td>
                <div class="fila-principal">
                  <span class="celda-titulo">{{ p.nombre }}</span>
                  <span class="celda-sub">{{ p.codigo }} · Stock {{ p.stock_actual }} u.</span>
                </div>
              </td>
              <td class="celda-numero">+{{ formatNumero(p.entradas) }}</td>
              <td class="celda-numero">–{{ formatNumero(p.salidas) }}</td>
              <td class="celda-numero">{{ formatSigno(p.neto) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Existencias por categoría</h3>
        </div>

        <p v-if="!inventario?.porCategoria?.length" class="texto-secundario">Sin productos activos registrados.</p>
        <table v-else class="tabla">
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col" class="celda-numero">Unidades</th>
              <th scope="col" class="celda-numero">Valor estimado</th>
              <th scope="col" class="celda-numero">% del total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in inventario.porCategoria" :key="c.nombre">
              <td>{{ c.nombre }}</td>
              <td class="celda-numero">{{ formatUnidades(c.unidades) }}</td>
              <td class="celda-numero">{{ formatPrecio(c.valor) }}</td>
              <td class="celda-numero">{{ porcentajeDe(c.valor, inventario.valorInventario) }}%</td>
            </tr>
            <tr class="tabla__total">
              <th scope="row">Total</th>
              <td class="celda-numero"><strong>{{ formatUnidades(inventario.unidades) }}</strong></td>
              <td class="celda-numero"><strong>{{ formatPrecio(inventario.valorInventario) }}</strong></td>
              <td class="celda-numero"><strong>100%</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="texto-meta" style="margin-top: var(--esp-16);">
          Valor estimado = precio de venta × unidades actuales en existencia.
        </p>
      </section>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Inventario total</h3>
        </div>

        <div class="metricas">
          <StatCard etiqueta="Productos activos" :valor="inventario.totalProductos" contexto="En catálogo" />
          <StatCard etiqueta="Unidades en stock" :valor="formatUnidades(inventario.unidades)" contexto="En todo el catálogo" />
          <StatCard etiqueta="Valor estimado" :valor="formatPrecio(inventario.valorInventario)" contexto="Precio × existencias" />
          <StatCard etiqueta="Bajo / agotados" :valor="`${inventario.stockBajo} / ${inventario.agotados}`" contexto="Revisá los mínimos" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BarChart from '@/components/common/BarChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Input from '@/components/common/Input.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import Alert from '@/components/common/Alert.vue'
import { resumenMovimientos, resumenInventario } from '@/services/reports'
import {
  formatNumero,
  formatUnidades,
  formatPrecio
} from '@/utils/format'

const PRESETS = [
  { etiqueta: 'Hoy', valor: 'hoy' },
  { etiqueta: '7 días', valor: '7d' },
  { etiqueta: '30 días', valor: '30d' },
  { etiqueta: '90 días', valor: '90d' },
  { etiqueta: 'Todo', valor: 'todo' }
]

const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const diasAtras = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - (n - 1))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const periodo = ref('7d')
const desde = ref(diasAtras(7))
const hasta = ref(hoy())

const cargando = ref(true)
const mensajeError = ref('')
const datos = ref(null)
const inventario = ref(null)

const errorFechas = computed(() =>
  desde.value && hasta.value && desde.value > hasta.value
    ? 'La fecha inicial no puede ser posterior a la final.'
    : ''
)

const aplicarPreset = (valor) => {
  periodo.value = valor
  if (valor === 'hoy') {
    desde.value = hoy()
    hasta.value = hoy()
  } else if (valor === '7d') {
    desde.value = diasAtras(7)
    hasta.value = hoy()
  } else if (valor === '30d') {
    desde.value = diasAtras(30)
    hasta.value = hoy()
  } else if (valor === '90d') {
    desde.value = diasAtras(90)
    hasta.value = hoy()
  } else if (valor === 'todo') {
    desde.value = ''
    hasta.value = ''
  }
}

const cargar = async () => {
  if (errorFechas.value) return

  cargando.value = true
  mensajeError.value = ''

  const d = desde.value || null
  const h = hasta.value || null

  const [det, inv] = await Promise.all([
    resumenMovimientos({ desde: d, hasta: h }),
    resumenInventario()
  ])

  if (det.error) {
    mensajeError.value = 'No se pudieron obtener los movimientos del período.'
    datos.value = null
  } else {
    datos.value = det.data
  }

  if (inv.error) {
    mensajeError.value = 'No se pudo obtener el resumen de inventario.'
    inventario.value = null
  } else {
    inventario.value = inv.data
  }

  cargando.value = false
}

onMounted(cargar)

// Detecta si los valores actuales corresponden a un preset conocido
// (para no perder el chip activo cuando se aplica uno).
const detectarPreset = () => {
  const h = hoy()
  if (desde.value === h && hasta.value === h) return 'hoy'
  if (desde.value === diasAtras(7) && hasta.value === h) return '7d'
  if (desde.value === diasAtras(30) && hasta.value === h) return '30d'
  if (desde.value === diasAtras(90) && hasta.value === h) return '90d'
  if (desde.value === '' && hasta.value === '') return 'todo'
  return 'personalizado'
}

watch([desde, hasta], () => {
  periodo.value = detectarPreset()
  cargar()
})

const neto = computed(() => datos.value?.neto ?? 0)

const formatSigno = (n) => (n >= 0 ? `+${formatUnidades(n)}` : `-${formatUnidades(Math.abs(n))}`)

const entradasPorDia = computed(() => (datos.value?.porDia ?? []).map((d) => d.entradas))
const salidasPorDia = computed(() => (datos.value?.porDia ?? []).map((d) => d.salidas))
const etiquetasPorDia = computed(() => (datos.value?.porDia ?? []).map((d) => String(Number(String(d.dia).slice(8, 10)))))

const productosOrdenados = computed(() => {
  const lista = datos.value?.porProducto ?? []
  return [...lista].sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas)).slice(0, 15)
})

const porcentajeDe = (valor, total) =>
  total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0'

</script>

<style scoped>
.chips-periodo {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-8);
}

.chip-periodo {
  min-height: 36px;
  padding: 0 var(--esp-16);
  font-size: 13px;
  color: var(--texto-secundario);
  background-color: var(--superficie);
  border: var(--borde-base);
  border-radius: var(--radio-control);
  cursor: pointer;
}

.chip-periodo:hover { border-color: var(--n-400); color: var(--texto); }

.chip-periodo--activo {
  color: var(--n-900);
  background-color: var(--azul-50);
  border-color: var(--azul-500);
  font-weight: 500;
}

.dark .chip-periodo--activo {
  color: #FAFAFA;
  background-color: rgba(144, 202, 249, 0.2);
  border-color: var(--azul-200);
}

.filtro-fechas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--esp-16);
  max-width: 420px;
}

.tabla__total td,
.tabla__total th {
  font-weight: 600;
  border-top: 2px solid var(--borde);
}

.celda-titulo { font-weight: 500; }
.celda-sub { color: var(--texto-secundario); font-size: 13px; }

@media (max-width: 700px) {
  .filtro-fechas { grid-template-columns: minmax(0, 1fr); }
}
</style>
