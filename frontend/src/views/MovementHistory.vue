<template>
  <div class="historial-page">
    <div class="page-header">
      <div class="page-title">
        <h1>Historial de movimientos</h1>
        <p>Consulta el registro de entradas y salidas de stock.</p>
      </div>
      <button class="btn-reg-mov" @click="irRegistrarMovimiento">
        + Registrar movimiento
      </button>
    </div>

    <div class="filtros-historial">
      <div class="campo-busqueda">
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar producto o movimiento..."
          class="input-buscar"
        />
      </div>
      <div class="campo-filtro">
        <select v-model="filtroTipo" class="select-filtro">
          <option value="todos">Tipo: Todos...</option>
          <option value="Entrada">Tipo: Entrada...</option>
          <option value="Salida">Tipo: Salida...</option>
        </select>
      </div>
      <div class="campo-filtro">
        <select v-model="filtroPeriodo" class="select-filtro">
          <option value="30">Período: Últimos 30 días...</option>
          <option value="7">Período: Últimos 7 días...</option>
          <option value="90">Período: Últimos 90 días...</option>
          <option value="todos">Período: Todo el historial...</option>
        </select>
      </div>
    </div>

    <div v-if="movimientosFiltrados.length === 0" class="estado-vacio">
      <div class="vacio-icon">📭</div>
      <p>No se encontraron movimientos.</p>
    </div>

    <table v-else class="tabla-historial">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Producto</th>
          <th>Tipo</th>
          <th>Cantidad</th>
          <th>Usuario</th>
          <th>Observación</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in movimientosFiltrados" :key="m.id_movimiento">
          <td class="fecha-mov">{{ formatearFecha(m.fecha_hora) }}</td>
          <td class="producto-mov">{{ getProductName(m.id_producto) }}</td>
          <td>
            <Badge :texto="m.tipo_movimiento" :variante="getBadgeVariant(m.tipo_movimiento)" />
          </td>
          <td class="cantidad-mov" :class="{ negativo: m.tipo_movimiento === 'Salida' }">
            {{ m.tipo_movimiento === 'Entrada' ? '+' : '-' }}{{ m.cantidad }}
          </td>
          <td class="usuario-mov">{{ getUserName(m.id_usuario) }}</td>
          <td class="obs-mov">{{ m.observacion || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="movimientosFiltrados.length > 0" class="paginacion">
      <span>1 - {{ movimientosFiltrados.length }} de {{ totalMovimientos }} · Página 1</span>
      <button class="btn-paginacion">Siguiendo →</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  getMovements,
  getProducts,
  getCurrentUser
} from '@/services/store'
import { users } from '@/data/users'
import Badge from '@/components/common/Badge.vue'

const productos = ref(getProducts())
const movimientos = ref(getMovements())
const listaUsuarios = users

const busqueda = ref('')
const filtroTipo = ref('todos')
const filtroPeriodo = ref('30')

const totalMovimientos = computed(() => movimientos.value.length)

const getProductName = (idProducto) => {
  const p = productos.value.find(prod => prod.id_producto === idProducto)
  return p ? p.nombre : 'Producto eliminado'
}

const getUserName = (idUsuario) => {
  const u = listaUsuarios.find(user => user.id_usuario === idUsuario)
  return u ? u.nombre : 'Usuario desconocido'
}

const getBadgeVariant = (tipo) => {
  return tipo === 'Entrada' ? 'entrada' : 'salida'
}

const formatearFecha = (fechaHora) => {
  if (!fechaHora) return '-'
  const fecha = new Date(fechaHora)
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const movimientosFiltrados = computed(() => {
  let resultado = movimientos.value

  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    resultado = resultado.filter(m => {
      const prod = getProductName(m.id_producto).toLowerCase()
      const user = getUserName(m.id_usuario).toLowerCase()
      return prod.includes(q) || user.includes(q)
    })
  }

  if (filtroTipo.value !== 'todos') {
    resultado = resultado.filter(m => m.tipo_movimiento === filtroTipo.value)
  }

  if (filtroPeriodo.value !== 'todos') {
    const dias = Number(filtroPeriodo.value)
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - dias)
    resultado = resultado.filter(m => new Date(m.fecha_hora) >= fechaLimite)
  }

  return resultado.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
})

const irRegistrarMovimiento = () => {
  // Usar router global
  const { useRouter } = require('vue-router')
  const router = useRouter()
  router.push({ name: 'registrar-movimiento' })
}
</script>

<style scoped>
.historial-page {
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
  display: flex;
  align-items: center;
  gap: var(--espacio-8);
}

.btn-reg-mov:hover {
  background-color: #1976D2;
}

.filtros-historial {
  display: flex;
  gap: var(--espacio-12);
  margin-bottom: var(--espacio-20);
  flex-wrap: wrap;
  align-items: center;
}

.campo-busqueda {
  flex: 1;
  min-width: 250px;
}

.input-buscar {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  box-sizing: border-box;
}

.campo-filtro {
  min-width: 200px;
}

.select-filtro {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  box-sizing: border-box;
  cursor: pointer;
}

.tabla-historial {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-blanco);
  border-radius: var(--radio-borde);
  overflow: hidden;
  border: var(--borde-base);
}

.tabla-historial th {
  background-color: var(--color-gris-fondo);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gris-oscuro);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--espacio-12) var(--espacio-16);
  text-align: left;
  border-bottom: 1px solid var(--color-gris-borde);
}

.tabla-historial td {
  padding: var(--espacio-12) var(--espacio-16);
  border-bottom: 1px solid var(--color-gris-borde);
  font-size: 14px;
  color: var(--color-negro);
}

.tabla-historial tr:last-child td {
  border-bottom: none;
}

.tabla-historial tr:hover {
  background-color: var(--color-gris-fondo);
}

.fecha-mov {
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.producto-mov {
  font-weight: 500;
}

.cantidad-mov {
  font-weight: 500;
}

.cantidad-mov.negativo {
  color: #D32F2F;
}

.usuario-mov {
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.obs-mov {
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.estado-vacio {
  text-align: center;
  padding: var(--espacio-40) var(--espacio-20);
  color: var(--color-gris-oscuro);
}

.vacio-icon {
  font-size: 48px;
  margin-bottom: var(--espacio-16);
  opacity: 0.4;
}

.paginacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--espacio-20);
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.btn-paginacion {
  background: none;
  border: none;
  color: var(--color-azul-500);
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .historial-page {
    padding: var(--espacio-16);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--espacio-16);
  }

  .filtros-historial {
    flex-direction: column;
    align-items: stretch;
  }

  .campo-busqueda,
  .campo-filtro {
    min-width: 100%;
  }
}
</style>