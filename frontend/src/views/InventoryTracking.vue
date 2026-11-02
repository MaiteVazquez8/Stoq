<template>
  <AppLayout>
    <template #default>
      <div class="inventario-vista">
        <div class="vista-header">
          <h1 class="titulo-pagina">Seguimiento del inventario</h1>
          <p class="subtitulo-pagina">Vista general de existencias, categorías y productos con stock bajo.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-etiqueta">Productos totales</span>
            <span class="stat-valor">{{ totalProductos }}</span>
            <span class="stat-cambio">en el catálogo</span>
          </div>
          <div class="stat-card">
            <span class="stat-etiqueta">Unidades en stock</span>
            <span class="stat-valor">{{ totalUnidades }}</span>
            <span class="stat-cambio">disponibles</span>
          </div>
          <div class="stat-card">
            <span class="stat-etiqueta">Categorías</span>
            <span class="stat-valor">{{ totalCategorias }}</span>
            <span class="stat-cambio">activas</span>
          </div>
          <div class="stat-card">
            <span class="stat-etiqueta">Stock bajo</span>
            <span class="stat-valor">{{ productosStockBajo.length }}</span>
            <span class="stat-cambio negativo">requieren atención</span>
          </div>
        </div>

        <div class="inventario-secciones">
          <div class="panel-inventario">
            <div class="panel-titulo">Existencias por categoría</div>
            <div class="categorias-lista">
              <div
                v-for="cat in categoriasConStock"
                :key="cat.id_categoria"
                class="categoria-item"
              >
                <span class="categoria-nombre">{{ cat.nombre }}</span>
                <div class="categoria-barra">
                  <div
                    class="categoria-progreso"
                    :style="{ width: cat.porcentaje + '%' }"
                  ></div>
                </div>
                <span class="cantidad-unidades">{{ cat.unidades }} unidades</span>
              </div>
            </div>
          </div>

          <div class="panel-stock-bajo">
            <div class="panel-titulo">Productos que necesitan atención</div>
            <div v-if="productosStockBajo.length === 0" class="estado-vacio">
              <div class="icono-vacio">✓</div>
              <p>No hay productos con stock bajo.</p>
            </div>
            <div v-else class="stock-bajo-lista">
              <div v-for="p in productosStockBajo" :key="p.id_producto" class="stock-bajo-item">
                <div class="stock-bajo-info">
                  <span class="stock-bajo-nombre">{{ p.nombre }}</span>
                  <span class="stock-bajo-codigo">{{ p.codigo }}</span>
                </div>
                <div class="stock-bajo-datos">
                  <span class="stock-actual">Actual: {{ p.stock_actual }}</span>
                  <span class="stock-minimo">Mínimo: {{ p.stock_minimo }}</span>
                </div>
                <Badge :texto="`${p.stock_actual} < ${p.stock_minimo}`" variante="stock-bajo" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { getProducts, getLowStockProducts, categories } from '@/services/store'
import Badge from '@/components/common/Badge.vue'

const productos = ref(getProducts())
const stockBajo = ref(getLowStockProducts())
const listaCategorias = categories

const totalProductos = computed(() => productos.value.length)
const totalUnidades = computed(() =>
  productos.value.reduce((sum, p) => sum + p.stock_actual, 0)
)
const totalCategorias = computed(() => listaCategorias.length)
const productosStockBajo = computed(() => stockBajo.value)

const categoriasConStock = computed(() => {
  const totalUnidades = productos.value.reduce((sum, p) => sum + p.stock_actual, 0) || 1
  return listaCategorias.map(cat => {
    const unidades = productos.value
      .filter(p => p.id_categoria === cat.id_categoria)
      .reduce((sum, p) => sum + p.stock_actual, 0)
    return {
      ...cat,
      unidades,
      porcentaje: Math.round((unidades / totalUnidades) * 100)
    }
  }).filter(c => c.unidades > 0)
})
</script>

<style scoped>
.inventario-vista {
  max-width: 1200px;
  margin: 0 auto;
}

.vista-header {
  margin-bottom: var(--espacio-24);
}

.titulo-pagina {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin-bottom: var(--espacio-8);
}

.subtitulo-pagina {
  font-size: 14px;
  color: var(--color-gris-oscuro);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--espacio-16);
  margin-bottom: var(--espacio-24);
}

.stat-card {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-20);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-8);
}

.stat-valor {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-negro);
}

.stat-etiqueta {
  font-size: 13px;
  color: var(--color-gris-oscuro);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-cambio {
  font-size: 13px;
  font-weight: 500;
}

.stat-cambio.negativo { color: #D32F2F; }

.inventario-secciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-24);
}

.panel-inventario,
.panel-stock-bajo {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.panel-titulo {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
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

.categoria-nombre {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.categoria-barra {
  height: 8px;
  background-color: var(--color-gris-fondo);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--color-gris-borde);
}

.categoria-progreso {
  height: 100%;
  background-color: var(--color-azul-500);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.cantidad-unidades {
  font-size: 12px;
  color: var(--color-gris-oscuro);
}

.stock-bajo-lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.stock-bajo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--espacio-16);
  background-color: var(--color-gris-fondo);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.stock-bajo-info {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.stock-bajo-nombre {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.stock-bajo-codigo {
  font-size: 12px;
  color: var(--color-gris-oscuro);
  font-family: 'Roboto', monospace;
}

.stock-bajo-datos {
  display: flex;
  gap: var(--espacio-16);
  font-size: 13px;
}

.stock-actual {
  color: #D32F2F;
  font-weight: 500;
}

.stock-minimo {
  color: var(--color-gris-oscuro);
}

@media (max-width: 768px) {
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