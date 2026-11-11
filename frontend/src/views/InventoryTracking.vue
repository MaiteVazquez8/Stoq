<template>
  <div class="pila--24">
    <PageHeader
      titulo="Seguimiento del inventario"
      :subtitulo="`Mínimos y existencias · ${rangoTexto}`"
    />

    <LoadingState v-if="cargando" texto="Cargando seguimiento…" />

    <Alert
      v-else-if="errorCarga"
      tipo="error"
      titulo="No pudimos cargar el seguimiento"
      :mensaje="errorCarga"
    />

    <template v-else>
      <div class="metricas">
        <StatCard etiqueta="Productos" :valor="resumen.totalProductos" contexto="En catálogo" />
        <StatCard etiqueta="Unidades en stock" :valor="resumen.totalUnidades" contexto="En total" />
        <StatCard etiqueta="Con stock bajo" :valor="resumen.stockBajo" contexto="Revisá los mínimos" />
        <StatCard etiqueta="Agotado" :valor="resumen.agotados" contexto="Sin unidades" />
      </div>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Existencias de {{ stockInicial }} a {{ stockFinal }} unidades</h3>
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
          :altura="220"
          descripcion="Evolución de las existencias durante los últimos 7 días"
        />
      </section>

      <section class="panel">
        <h3 class="panel-titulo">Existencias por categoría · {{ resumen.totalUnidades }} u.</h3>

        <ul v-if="categorias.length" class="categorias-existencias">
          <li v-for="categoria in categorias" :key="categoria.id_categoria" class="barra-categoria">
            <span>{{ categoria.nombre }}</span>
            <span class="barra-categoria__pista">
              <span
                class="barra-categoria__relleno"
                :style="{ width: `${porcentajeDe(categoria)}%` }"
              />
            </span>
            <span class="barra-categoria__valor">{{ formatUnidades(categoria.unidades) }}</span>
          </li>
        </ul>

        <EmptyState
          v-else
          icono="caja"
          titulo="Sin existencias para mostrar"
          texto="Registrá productos para ver cómo se distribuyen por categoría."
        />
      </section>

      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">{{ atencion.length }} {{ atencion.length === 1 ? 'producto necesita' : 'productos necesitan' }} atención</h3>
        </div>

        <ul v-if="atencion.length" class="lista-atencion">
          <li v-for="item in atencion" :key="item.producto.id_producto" class="item-atencion">
            <span class="item-atencion__cabecera">
              <Badge :estado="item.estado" />
              <span class="item-atencion__producto">{{ item.producto.nombre }}</span>
            </span>
            <span class="item-atencion__detalle">
              {{ item.producto.codigo }} · {{ item.producto.stock_actual }} disponibles · mínimo {{ item.producto.stock_minimo }} u.
            </span>
            <span class="item-atencion__faltante">
              Faltan {{ item.faltante }} u. para alcanzar el mínimo.
            </span>
          </li>
        </ul>

        <EmptyState
          v-else
          icono="check-circulo"
          titulo="Todo en orden"
          texto="Ningún producto está por debajo de su mínimo."
        />

        <p class="nota-linea nota-linea--panel">
          <Icon nombre="info" :tamano="16" class="nota-linea__icono" />
          Los estados combinan etiqueta, símbolo y borde: Suficiente (mayor o igual al mínimo), Stock bajo (por debajo) y Agotado (sin unidades).
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Badge from '@/components/common/Badge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import LineChart from '@/components/common/LineChart.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import Alert from '@/components/common/Alert.vue'
import {
  existenciasPorCategoria,
  productosQueNecesitanAtencion,
  resumenInventario,
  serieExistencias,
  etiquetaRango
} from '@/services/analytics'
import { formatUnidades } from '@/utils/format'

const resumen = ref({ totalProductos: 0, totalUnidades: 0, stockBajo: 0, agotados: 0 })
const serie = ref({ valores: [], etiquetas: [] })
const categorias = ref([])
const atencion = ref([])

const cargando = ref(true)
const errorCarga = ref('')

onMounted(async () => {
  cargando.value = true
  errorCarga.value = ''

  const [resumenResp, serieResp, categoriasResp, atencionResp] = await Promise.all([
    resumenInventario(),
    serieExistencias(),
    existenciasPorCategoria(),
    productosQueNecesitanAtencion()
  ])

  if (resumenResp.errorProductos || resumenResp.errorMovimientos) {
    errorCarga.value = 'Revisá tu conexión o volvé a intentarlo. Si el problema sigue, avisá al administrador.'
  } else {
    resumen.value = resumenResp
    serie.value = serieResp
    categorias.value = categoriasResp
    atencion.value = atencionResp
  }

  cargando.value = false
})

const stockInicial = computed(() => serie.value.valores[0] ?? 0)
const stockFinal = computed(() => serie.value.valores[serie.value.valores.length - 1] ?? 0)
const rangoTexto = computed(() => etiquetaRango())

const porcentajeDe = (categoria) =>
  resumen.value.totalUnidades > 0
    ? (categoria.unidades / resumen.value.totalUnidades) * 100
    : 0
</script>

<style scoped>
.panel__cabecera {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  margin-bottom: var(--esp-16);
}

.categorias-existencias {
  display: flex;
  flex-direction: column;
  gap: var(--esp-12);
  list-style: none;
  margin: 0;
  padding: 0;
  margin-top: var(--esp-12);
}

.categorias-existencias .barra-categoria__relleno {
  height: 100%;
}

.nota-linea--panel { margin-top: var(--esp-16); }
</style>
