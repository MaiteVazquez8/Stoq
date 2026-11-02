<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="titulo-pagina">Panel principal</h1>
      <p class="subtitulo-pagina">Todo tu stock, en claro.</p>
    </div>

    <Alert v-if="alertaStockBajo && alertaStockBajo.length > 0" tipo="advertencia">
      Hay {{ alertaStockBajo.length }} producto(s) con stock bajo. Revise el inventario.
    </Alert>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-etiqueta">Productos</span>
        <span class="stat-valor">{{ totalProductos }}</span>
        <span class="stat-cambio">en el catálogo</span>
      </div>
      <div class="stat-card">
        <span class="stat-etiqueta">Unidades en stock</span>
        <span class="stat-valor">{{ totalUnidades }}</span>
        <span class="stat-cambio">disponibles</span>
      </div>
      <div class="stat-card">
        <span class="stat-etiqueta">Stock bajo</span>
        <span class="stat-valor">{{ productosStockBajo.length }}</span>
        <span class="stat-cambio negativo">requieren atención</span>
      </div>
      <div class="stat-card">
        <span class="stat-etiqueta">Movimientos hoy</span>
        <span class="stat-valor">{{ movimientosHoy }}</span>
        <span class="stat-cambio positivo">registrados</span>
      </div>
    </div>

    <div class="dashboard-contenido">
      <div class="panel-grafico">
        <div class="panel-titulo">Evolución del stock</div>
        <div class="grafico-placeholder">
          <div class="grafico-linea">
            <div class="linea-tendencia"></div>
          </div>
          <p class="grafico-nota">Registre entradas y salidas para ver la evolución de existencias.</p>
        </div>
      </div>

      <div class="panel-movimientos-recientes">
        <div class="panel-header">
          <span class="panel-titulo">Últimos movimientos</span>
          <a href="#" class="ver-todo" @click.prevent="irHistorial">Ver todo el historial →</a>
        </div>
        <div class="movimientos-lista">
          <div v-if="movimientosRecientes.length === 0" class="estado-vacio">
            <div class="icono-vacio">📭</div>
            <p>No hay movimientos registrados.</p>
          </div>
          <div v-else class="movimiento-item" v-for="m in movimientosRecientes" :key="m.id_movimiento">
            <div class="movimiento-info">
              <span class="movimiento-producto">{{ getProductName(m.id_producto) }}</span>
              <span class="movimiento-tipo">{{ m.tipo_movimiento }}</span>
            </div>
            <span class="movimiento-cantidad" :class="m.tipo_movimiento === 'Salida' ? 'negativo' : 'positivo'">
              {{ m.tipo_movimiento === 'Entrada' ? '+' : '-' }}{{ m.cantidad }}
            </span>
            <span class="movimiento-fecha">{{ formatearFecha(m.fecha_hora) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="acciones-rapidas">
      <h3 class="seccion-titulo">Acciones rápidas</h3>
      <div class="acciones-grid">
        <button
          class="btn btn-principal accion-tarjeta"
          @click="irProductos"
        >
          📦 Gestionar productos
        </button>
        <button
          class="btn btn-principal accion-tarjeta"
          @click="irRegistrarMovimiento"
        >
          🔄 Registrar movimiento
        </button>
        <button
          class="btn btn-secundario accion-tarjeta"
          @click="irInventario"
        >
          📈 Seguimiento de inventario
        </button>
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
  getCurrentUser,
  isAdmin,
  isOperador
} from '@/services/store'
import Alert from '@/components/common/Alert.vue'

const router = useRouter()
const usuario = getCurrentUser()

const productos = ref(getProducts())
const movimientos = ref(getMovements())
const stockBajo = ref(getLowStockProducts())

const totalProductos = computed(() => productos.value.length)
const totalUnidades = computed(() =>
  productos.value.reduce((sum, p) => sum + p.stock_actual, 0)
)
const productosStockBajo = computed(() => stockBajo.value)

const hoy = new Date()
hoy.setHours(0, 0, 0, 0)

const movimientosHoy = computed(() =>
  movimientos.value.filter(m => {
    const fecha = new Date(m.fecha_hora)
    fecha.setHours(0, 0, 0, 0)
    return fecha.getTime() === hoy.getTime()
  }).length
)

const movimientosRecientes = computed(() =>
  [...movimientos.value]
    .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
    .slice(0, 5)
)

const alertaStockBajo = computed(() => productosStockBajo.value)

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

const irProductos = () => router.push({ name: 'productos' })
const irRegistrarMovimiento = () => router.push({ name: 'registrar-movimiento' })
const irHistorial = () => router.push({ name: 'historial-movimientos' })
const irInventario = () => router.push({ name: 'inventario' })
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
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

.stat-cambio.positivo { color: var(--color-azul-500); }
.stat-cambio.negativo { color: #D32F2F; }

.dashboard-contenido {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--espacio-24);
  margin-bottom: var(--espacio-24);
}

.panel-grafico,
.panel-movimientos-recientes {
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

.grafico-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-gris-oscuro);
}

.grafico-linea {
  width: 100%;
  height: 120px;
  border: 1px dashed var(--color-gris-borde);
  border-radius: var(--radio-borde);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--espacio-12);
  position: relative;
  overflow: hidden;
}

.linea-tendencia {
  position: absolute;
  bottom: 20%;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-azul-500), transparent);
  opacity: 0.6;
}

.grafico-nota {
  font-size: 13px;
  color: var(--color-gris-texto);
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
}

.movimientos-lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-12);
}

.movimiento-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--espacio-12);
  background-color: var(--color-gris-fondo);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.movimiento-info {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.movimiento-producto {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.movimiento-tipo {
  font-size: 12px;
  color: var(--color-gris-oscuro);
  text-transform: uppercase;
}

.movimiento-cantidad {
  font-size: 14px;
  font-weight: 500;
}

.movimiento-cantidad.positivo { color: var(--color-azul-500); }
.movimiento-cantidad.negativo { color: #D32F2F; }

.movimiento-fecha {
  font-size: 12px;
  color: var(--color-gris-texto);
}

.acciones-rapidas {
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-24);
}

.seccion-titulo {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-negro);
  margin-bottom: var(--espacio-16);
}

.acciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--espacio-12);
}

.accion-tarjeta {
  padding: var(--espacio-16) var(--espacio-20);
  text-align: left;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .dashboard-contenido {
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