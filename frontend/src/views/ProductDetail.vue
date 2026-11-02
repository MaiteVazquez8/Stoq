<template>
  <div class="detalle-page">
    <div class="page-header">
      <button class="btn-volver" @click="volver">
        ← Volver a productos
      </button>
      <div class="info-producto">
        <h1>{{ producto?.nombre }}</h1>
        <span class="sku-producto">SKU: {{ producto?.codigo }}</span>
      </div>
    </div>

    <div class="stock-principal">
      <span class="numero-stock">{{ producto?.stock_actual }}</span>
      <span class="label-stock">unidades</span>
    </div>

    <Alert v-if="alertaStockBajo" tipo="advertencia" :mensaje="alertaStockBajo" />

    <div class="detalle-contenido">
      <div class="columna-principal">
        <div class="info-basica">
          <div class="fila-info">
            <span class="label-info">Categoría:</span>
            <span class="valor-info">{{ categoriaNombre }}</span>
          </div>
          <div class="fila-info">
            <span class="label-info">Precio:</span>
            <span class="valor-info precio">{{ formatCurrency(producto?.precio) }}</span>
          </div>
          <div class="fila-info">
            <span class="label-info">Stock mínimo:</span>
            <span class="valor-info">{{ producto?.stock_minimo || 'No definido' }}</span>
          </div>
          <div class="fila-info">
            <span class="label-info">Fecha de creación:</span>
            <span class="valor-info">{{ formatearFecha(producto?.fecha_creacion) }}</span>
          </div>
        </div>

        <div v-if="producto?.descripcion" class="descripcion-panel">
          <h3 class="titulo-descripcion">Descripción</h3>
          <p class="texto-descripcion">{{ producto.descripcion }}</p>
        </div>

        <div class="acciones-detalle">
          <button
            v-if="esAdmin"
            class="btn-editar"
            @click="irEditar"
          >
            ✏️ Editar producto
          </button>
          <button
            class="btn-movimiento"
            @click="irMovimiento"
          >
            🔄 Registrar movimiento
          </button>
        </div>
      </div>

      <div class="columna-secundaria">
        <div class="panel-movimientos">
          <h3 class="titulo-panel">Movimientos de {{ producto?.codigo }}</h3>
          <MovementTable :producto-id="productoId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getProduct,
  getCategoryName,
  formatCurrency,
  isStockLow,
  isAdmin
} from '@/services/store'
import MovementTable from '@/components/inventory/MovementTable.vue'
import Alert from '@/components/common/Alert.vue'

const route = useRoute()
const router = useRouter()
const productoId = Number(route.params.id)

const esAdmin = isAdmin()

const producto = computed(() => getProduct(productoId))

const categoriaNombre = computed(() => {
  if (!producto.value) return '-'
  return getCategoryName(producto.value.id_categoria)
})

const alertaStockBajo = computed(() => {
  if (!producto.value) return ''
  if (isStockLow(producto.value)) {
    return `Stock bajo: ${producto.value.stock_actual} unidad(es), mínimo ${producto.value.stock_minimo}.`
  }
  return ''
})

const volver = () => router.push({ name: 'productos' })
const irEditar = () => router.push({ name: 'producto-editar', params: { id: productoId } })
const irMovimiento = () => {
  router.push({ name: 'registrar-movimiento', query: { producto: productoId } })
}

const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR')
}
</script>

<style scoped>
.detalle-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--espacio-24);
  background-color: var(--color-gris-fondo);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espacio-24);
  flex-wrap: wrap;
  gap: var(--espacio-16);
}

.btn-volver {
  padding: var(--espacio-10) var(--espacio-16);
  font-family: var(--fuente-principal);
  font-size: 14px;
  color: var(--color-azul-500);
  background: none;
  border: 1px solid var(--color-azul-500);
  border-radius: var(--radio-borde);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--espacio-6);
}

.btn-volver:hover {
  background-color: var(--color-azul-50);
}

.info-producto h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-negro);
  margin: 0 0 var(--espacio-4) 0;
}

.sku-producto {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  font-family: 'Roboto', monospace;
}

.stock-principal {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  text-align: center;
  margin-bottom: var(--espacio-24);
}

.numero-stock {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-negro);
}

.label-stock {
  font-size: 14px;
  color: var(--color-gris-oscuro);
}

.detalle-contenido {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--espacio-24);
}

.columna-principal {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-20);
}

.info-basica {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.fila-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.label-info {
  color: var(--color-gris-oscuro);
}

.valor-info {
  font-weight: 500;
  color: var(--color-negro);
}

.valor-info.precio {
  color: var(--color-azul-900);
  font-weight: 700;
}

.descripcion-panel {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
}

.titulo-descripcion {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
  margin: 0 0 var(--espacio-12) 0;
}

.texto-descripcion {
  font-size: 14px;
  color: var(--color-negro);
  line-height: 1.6;
  margin: 0;
}

.acciones-detalle {
  display: flex;
  gap: var(--espacio-12);
}

.acciones-detalle .btn-editar,
.acciones-detalle .btn-movimiento {
  flex: 1;
  padding: var(--espacio-14);
  font-family: var(--fuente-principal);
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--radio-borde);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-8);
}

.btn-editar {
  background-color: var(--color-azul-500);
  color: var(--color-blanco);
}

.btn-editar:hover {
  background-color: #1976D2;
}

.btn-movimiento {
  background-color: var(--color-blanco);
  color: var(--color-azul-900);
  border: var(--borde-base);
}

.btn-movimiento:hover {
  background-color: var(--color-gris-fondo);
}

.columna-secundaria {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.panel-movimientos {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
}

.titulo-panel {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
  margin: 0 0 var(--espacio-16) 0;
}

@media (max-width: 768px) {
  .detalle-page {
    padding: var(--espacio-16);
  }

  .detalle-contenido {
    grid-template-columns: 1fr;
  }

  .acciones-detalle {
    flex-direction: column;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>