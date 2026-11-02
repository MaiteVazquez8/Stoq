<template>
  <div class="inventario-page">
    <div class="page-header">
      <div class="page-title">
        <h1>Seguimiento del inventario</h1>
        <p>Vista general de existencias, categorías y productos con stock bajo.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Productos</span>
        <span class="stat-value">{{ totalProductos }}</span>
        <span class="stat-desc">en el catálogo</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Unidades en stock</span>
        <span class="stat-value">{{ totalUnidades }}</span>
        <span class="stat-desc">disponibles</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Con stock bajo</span>
        <span class="stat-value">{{ productosStockBajo.length }}</span>
        <span class="stat-desc">requieren atención</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Agotado</span>
        <span class="stat-value">{{ productosAgotados.length }}</span>
        <span class="stat-desc">sin unidades disponibles</span>
      </div>
    </div>

    <div class="inventario-secciones">
      <div class="panel-evolucion">
        <div class="titulo-panel">Evolución del stock</div>
        <div class="resumen-existencias">
          <span class="texto-existencias">Existencias: {{ totalUnidades }} unidades</span>
        </div>
        <div class="chart-placeholder">
          <svg class="chart-line" viewBox="0 0 400 200">
            <polyline points="20,140 80,120 140,160 200,100 260,140 320,90 380,130" fill="none" stroke="#2196F3" stroke-width="2" />
          </svg>
        </div>
      </div>

      <div class="panel-categorias">
        <div class="titulo-panel">Existencias por categoría: {{ totalUnidades }} u.</div>
        <div class="categorias-lista">
          <div v-for="cat in categoriasConStock" :key="cat.id_categoria" class="categoria-item">
            <span class="nombre-categoria">{{ cat.nombre }}</span>
            <div class="barra-progreso">
              <div
                class="relleno-barra"
                :style="{ width: cat.porcentaje + '%' }"
              ></div>
            </div>
            <span class="cantidad-categoria">{{ cat.unidades }} u.</span>
          </div>
        </div>
      </div>

      <div class="panel-atencion">
        <div class="titulo-panel">{{ productosStockBajo.length }} productos necesitan atención</div>
        <div v-if="productosStockBajo.length === 0" class="estado-vacio">
          <div class="vacio-icon">✓</div>
          <p>No hay productos con stock bajo.</p>
        </div>
        <div v-else class="lista-atencion">
          <div v-for="p in productosStockBajo" :key="p.id_producto" class="item-atencion">
            <div class="info-atencion">
              <span class="nombre-atencion">{{ p.nombre }}</span>
              <span class="sku-atencion">{{ p.codigo }}</span>
            </div>
            <div class="datos-atencion">
              <span class="actual">Actual: {{ p.stock_actual }}</span>
              <span class="minimo">Mínimo: {{ p.stock_minimo }}</span>
            </div>
            <Badge texto="Stock bajo" variante="stock-bajo" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  getProducts,
  getLowStockProducts,
  categories
} from '@/services/store'
import Badge from '@/components/common/Badge.vue'

const productos = ref(getProducts())
const stockBajo = ref(getLowStockProducts())
const listaCategorias = categories

const totalProductos = computed(() => productos.value.length)
const totalUnidades = computed(() =>
  productos.value.reduce((sum, p) => sum + p.stock_actual, 0)
)
const productosStockBajo = computed(() => stockBajo.value)
const productosAgotados = computed(() =>
  productos.value.filter(p => p.stock_actual === 0)
)

const categoriasConStock = computed(() => {
  const total = totalUnidades.value || 1
  return listaCategorias.map(cat => {
    const unidades = productos.value
      .filter(p => p.id_categoria === cat.id_categoria)
      .reduce((sum, p) => sum + p.stock_actual, 0)
    return {
      ...cat,
      unidades,
      porcentaje: Math.round((unidades / total) * 100)
    }
  }).filter(c => c.unidades > 0)
})
</script>

<style scoped>
.inventario-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--espacio-24);
  background-color: var(--color-gris-fondo);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--espacio-24);
}

.page-title h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin: 0 0 var(--espacio-8) 0;
}

.page-title p {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--espacio-16);
  margin-bottom: var(--espacio-32);
}

.stat-card {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-8);
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gris-oscuro);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-negro);
}

.stat-desc {
  font-size: 13px;
  color: var(--color-gris-texto);
}

.inventario-secciones {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--espacio-24);
}

.panel-evolucion,
.panel-categorias,
.panel-atencion {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.titulo-panel {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
}

.resumen-existencias {
  font-size: 13px;
  color: var(--color-gris-oscuro);
  margin-bottom: var(--espacio-8);
}

.chart-placeholder {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gris-oscuro);
}

.chart-line {
  width: 100%;
}

.categorias-lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.categoria-item {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-8);
}

.nombre-categoria {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.barra-progreso {
  height: 8px;
  background-color: var(--color-gris-fondo);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--color-gris-borde);
}

.relleno-barra {
  height: 100%;
  background-color: var(--color-azul-500);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.cantidad-categoria {
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.lista-atencion {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.item-atencion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--espacio-16);
  background-color: var(--color-gris-fondo);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.info-atencion {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.nombre-atencion {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.sku-atencion {
  font-size: 12px;
  color: var(--color-gris-oscuro);
  font-family: 'Roboto', monospace;
}

.datos-atencion {
  display: flex;
  gap: var(--espacio-16);
  font-size: 13px;
}

.actual {
  color: #D32F2F;
  font-weight: 500;
}

.minimo {
  color: var(--color-gris-oscuro);
}

.estado-vacio {
  text-align: center;
  padding: var(--espacio-30) var(--espacio-20);
  color: var(--color-gris-oscuro);
}

.vacio-icon {
  font-size: 48px;
  margin-bottom: var(--espacio-16);
  opacity: 0.4;
}

@media (max-width: 768px) {
  .inventario-page {
    padding: var(--espacio-16);
  }

  .inventario-secciones {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>