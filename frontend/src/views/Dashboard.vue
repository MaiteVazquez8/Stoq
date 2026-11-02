<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div class="dashboard-title">
        <h1>Todo tu stock, en claro</h1>
        <p>Resumen del inventario de Casa Nube - Demo · Última actualización: 27 oct 2026</p>
      </div>
      <button class="btn-reg-mov" @click="irRegistrarMovimiento">Registrar movimiento</button>
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

    <div class="dashboard-content">
      <div class="chart-panel">
        <div class="chart-title">Evolución del stock</div>
        <div class="chart-placeholder">
          <svg class="chart-line" viewBox="0 0 400 200">
            <polyline points="20,140 80,120 140,160 200,100 260,140 320,90 380,130" fill="none" stroke="#2196F3" stroke-width="2" />
          </svg>
          <p class="chart-note">Registre entradas y salidas para ver la evolución de existencias.</p>
        </div>
      </div>

      <div class="movements-panel">
        <div class="panel-header">
          <span class="panel-title">Últimos movimientos</span>
          <a href="#" class="ver-todo" @click.prevent="irHistorial">Ver todo el historial →</a>
        </div>
        <div class="movements-list">
          <div v-for="m in movimientosRecientes" :key="m.id_movimiento" class="movement-row">
            <div class="movement-info">
              <span class="movement-product">{{ getProductName(m.id_producto) }}</span>
              <span class="movement-type">{{ m.tipo_movimiento }}</span>
            </div>
            <span class="movement-qty">{{ m.cantidad }}</span>
            <span class="movement-date">{{ formatearFecha(m.fecha_hora) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getProducts,
  getMovements,
  getLowStockProducts,
  getCurrentUser
} from '@/services/store'

const router = useRouter()
const productos = ref(getProducts())
const movimientos = ref(getMovements())
const stockBajo = ref(getLowStockProducts())

const totalProductos = computed(() => productos.value.length)
const totalUnidades = computed(() =>
  productos.value.reduce((sum, p) => sum + p.stock_actual, 0)
)
const productosStockBajo = computed(() => stockBajo.value)
const productosAgotados = computed(() =>
  productos.value.filter(p => p.stock_actual === 0)
)

const movimientosRecientes = computed(() =>
  [...movimientos.value]
    .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
    .slice(0, 5)
)

const getProductName = (idProducto) => {
  const p = productos.value.find(prod => prod.id_producto === idProducto)
  return p ? p.nombre : 'Producto eliminado'
}

const formatearFecha = (fechaHora) => {
  if (!fechaHora) return '-'
  const fecha = new Date(fechaHora)
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const irRegistrarMovimiento = () => router.push({ name: 'registrar-movimiento' })
const irHistorial = () => router.push({ name: 'historial-movimientos' })
</script>

<style scoped>
.dashboard-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--espacio-24);
  background-color: var(--color-gris-fondo);
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espacio-32);
}

.dashboard-title h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-negro);
  margin: 0 0 var(--espacio-8) 0;
  letter-spacing: -0.5px;
}

.dashboard-title p {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  margin: 0;
}

.btn-reg-mov {
  padding: var(--espacio-12) var(--espacio-24);
  font-family: var(--fuente-principal);
  font-size: 14px;
  font-weight: 500;
  background-color: var(--color-azul-500);
  color: var(--color-blanco);
  border: none;
  border-radius: var(--radio-borde);
  cursor: pointer;
}

.btn-reg-mov:hover {
  background-color: #1976D2;
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

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--espacio-24);
}

.chart-panel,
.movements-panel {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.chart-title,
.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-gris-oscuro);
}

.chart-line {
  width: 100%;
  max-width: 360px;
}

.chart-note {
  font-size: 13px;
  margin-top: var(--espacio-12);
  text-align: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espacio-16);
}

.ver-todo {
  font-size: 13px;
  color: var(--color-azul-500);
  font-weight: 500;
  text-decoration: none;
}

.movements-list {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.movement-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--espacio-12);
  background-color: var(--color-gris-fondo);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.movement-info {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.movement-product {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.movement-type {
  font-size: 12px;
  color: var(--color-gris-oscuro);
  text-transform: uppercase;
}

.movement-qty {
  font-size: 14px;
  font-weight: 500;
}

.movement-date {
  font-size: 12px;
  color: var(--color-gris-texto);
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: var(--espacio-16);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--espacio-16);
  }

  .dashboard-content {
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