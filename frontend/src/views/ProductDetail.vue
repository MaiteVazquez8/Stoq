<template>
  <AppLayout>
    <template #default>
      <div class="producto-detalle-vista">
        <div class="vista-header">
          <div class="acciones-volver">
            <button class="btn btn-secundario btn-pequeno" @click="volver">
              ← Volver a productos
            </button>
          </div>
          <h1 class="titulo-pagina">{{ producto?.nombre }}</h1>
          <span class="codigo-producto">{{ producto?.codigo }}</span>
        </div>

        <Alert v-if="alertaStockBajo" tipo="advertencia" :mensaje="alertaStockBajo" />

        <div class="detalle-grid">
          <div class="detalle-principal">
            <div class="stock-principal">
              <span class="stock-numero">{{ producto?.stock_actual }}</span>
              <span class="stock-label">unidades</span>
            </div>

            <div class="detalle-info">
              <div class="info-fila">
                <span class="info-fecha">SKU:</span>
                <span class="info-valor">{{ producto?.codigo }}</span>
              </div>
              <div class="info-fila">
                <span class="info-fecha">Categoría:</span>
                <span class="info-valor">{{ categoriaNombre }}</span>
              </div>
              <div class="info-fila">
                <span class="info-fecha">Precio:</span>
                <span class="info-valor precio">{{ formatCurrency(producto?.precio) }}</span>
              </div>
              <div class="info-fila">
                <span class="info-fecha">Stock mínimo:</span>
                <span class="info-valor">{{ producto?.stock_minimo || 'No definido' }}</span>
              </div>
              <div class="info-fila">
                <span class="info-fecha">Fecha de creación:</span>
                <span class="info-valor">{{ formatearFecha(producto?.fecha_creacion) }}</span>
              </div>
            </div>

            <div v-if="producto?.descripcion" class="detalle-descripcion">
              <h3 class="detalle-subtitulo">Descripción</h3>
              <p>{{ producto.descripcion }}</p>
            </div>

            <div class="detalle-acciones">
              <button
                v-if="esAdminComputed"
                class="btn btn-principal"
                @click="irEditar"
              >
                ✏️ Editar producto
              </button>
              <button
                class="btn btn-principal"
                @click="irRegistrarMovimiento"
              >
                🔄 Registrar movimiento
              </button>
            </div>
          </div>

          <div class="detalle-secundario">
            <div class="panel-movimientos">
              <h3 class="panel-titulo">Movimientos de {{ producto?.codigo }}</h3>
              <MovementTable :producto-id="productoId" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getCategoryName, formatCurrency, isStockLow, isAdmin } from '@/services/store'
import AppLayout from '@/components/layout/AppLayout.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'

const route = useRoute()
const router = useRouter()
const productoId = Number(route.params.id)

const producto = computed(() => getProduct(productoId))
const esAdminComputed = computed(() => isAdmin())

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
const irRegistrarMovimiento = () => {
  router.push({ name: 'registrar-movimiento', query: { producto: productoId } })
}

const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR')
}
</script>

<style scoped>
.producto-detalle-vista {
  max-width: 1200px;
  margin: 0 auto;
}

.vista-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--espacio-24);
  flex-wrap: wrap;
  gap: var(--espacio-16);
}

.acciones-volver {
  margin-bottom: var(--espacio-16);
}

.titulo-pagina {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin: 0;
}

.codigo-producto {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  font-family: 'Roboto', monospace;
  background-color: var(--color-gris-fondo);
  padding: var(--espacio-6) var(--espacio-12);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.detalle-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--espacio-24);
}

.detalle-principal {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-20);
}

.stock-principal {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  text-align: center;
}

.stock-numero {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-negro);
}

.stock-label {
  font-size: 14px;
  color: var(--color-gris-oscuro);
}

.detalle-info {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.info-fila {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-fecha {
  color: var(--color-gris-oscuro);
}

.info-valor {
  font-weight: 500;
  color: var(--color-negro);
}

.info-valor.precio {
  color: var(--color-azul-900);
  font-weight: 700;
}

.detalle-descripcion {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
}

.detalle-subtitulo {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
  margin-bottom: var(--espacio-8);
}

.detalle-acciones {
  display: flex;
  gap: var(--espacio-12);
}

.detalle-acciones .btn {
  flex: 1;
  justify-content: center;
}

.panel-movimientos {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  height: fit-content;
}

@media (max-width: 768px) {
  .detalle-grid {
    grid-template-columns: 1fr;
  }

  .vista-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detalle-acciones {
    flex-direction: column;
  }
}
</style>