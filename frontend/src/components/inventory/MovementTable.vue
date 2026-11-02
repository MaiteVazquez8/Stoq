<template>
  <div class="historial-movimientos">
    <div class="historial-header">
      <h2 class="titulo-seccion">Historial de movimientos</h2>
      <button class="btn btn-principal btn-pequeno" @click="$emit('registrar-movimiento')">
        + Registrar movimiento
      </button>
    </div>

    <div class="filtros-historial">
      <div class="campo-busqueda">
        <input
          type="text"
          placeholder="Buscar producto o movimiento..."
          v-model="busqueda"
        />
      </div>
      <div class="campo-tipo">
        <select v-model="filtroTipo">
          <option value="todos">Todos los tipos</option>
          <option value="Entrada">Entradas</option>
          <option value="Salida">Salidas</option>
        </select>
      </div>
      <div class="campo-periodo">
        <select v-model="filtroPeriodo">
          <option value="30">Últimos 30 días</option>
          <option value="7">Últimos 7 días</option>
          <option value="90">Últimos 90 días</option>
          <option value="todos">Todo el historial</option>
        </select>
      </div>
    </div>

    <div v-if="movimientosFiltrados.length === 0" class="estado-vacio">
      <div class="icono-vacio">📭</div>
      <p>No se encontraron movimientos.</p>
    </div>

    <table v-else class="tabla">
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
        <tr v-for="movimiento in movimientosFiltrados" :key="movimiento.id_movimiento">
          <td>{{ formatearFecha(movimiento.fecha_hora) }}</td>
          <td>{{ getProductName(movimiento.id_producto) }}</td>
          <td>
            <Badge :texto="movimiento.tipo_movimiento" :variante="getBadgeVariant(movimiento.tipo_movimiento)" />
          </td>
          <td :class="{ 'cantidad-negativa': movimiento.tipo_movimiento === 'Salida' }">
            {{ movimiento.cantidad }}
          </td>
          <td>{{ getUserName(movimiento.id_usuario) }}</td>
          <td>{{ movimiento.observacion || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="movimientosFiltrados.length > 0" class="resumen-historial">
      <span class="resumen-total">
        Total de movimientos: {{ movimientosFiltrados.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getMovements, getProducts, getCurrentUser, getCategoryName } from '@/services/store'
import { users } from '@/data/users'
import Badge from '@/components/common/Badge.vue'

const props = defineProps({
  productoId: { type: [Number, String], default: null }
})

const emit = defineEmits(['registrar-movimiento'])

const busqueda = ref('')
const filtroTipo = ref('todos')
const filtroPeriodo = ref('30')

const movimientos = ref(getMovements())
const todosProductos = ref(getProducts())
const listaUsuarios = users
const usuarioActual = getCurrentUser()

const getProductName = (idProducto) => {
  const p = todosProductos.value.find(prod => prod.id_producto === idProducto)
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

  // Filtro por producto si se especifica
  if (props.productoId) {
    resultado = resultado.filter(m => m.id_producto === Number(props.productoId))
  }

  // Filtro por búsqueda
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    resultado = resultado.filter(m => {
      const prod = getProductName(m.id_producto).toLowerCase()
      const user = getUserName(m.id_usuario).toLowerCase()
      return prod.includes(q) || user.includes(q)
    })
  }

  // Filtro por tipo
  if (filtroTipo.value !== 'todos') {
    resultado = resultado.filter(m => m.tipo_movimiento === filtroTipo.value)
  }

  // Filtro por período
  if (filtroPeriodo.value !== 'todos') {
    const dias = Number(filtroPeriodo.value)
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - dias)
    resultado = resultado.filter(m => new Date(m.fecha_hora) >= fechaLimite)
  }

  // Ordenar por fecha descendente
  return resultado.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
})
</script>

<style scoped>
.historial-movimientos {
  max-width: 1000px;
  margin: 0 auto;
}

.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espacio-20);
}

.titulo-seccion {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-azul-900);
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

.campo-busqueda input {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
}

.campo-tipo select,
.campo-periodo select {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  min-width: 200px;
}

.cantidad-negativa {
  color: #D32F2F;
  font-weight: 500;
}

.resumen-historial {
  margin-top: var(--espacio-16);
  padding-top: var(--espacio-16);
  border-top: var(--borde-base);
  display: flex;
  justify-content: flex-end;
  gap: var(--espacio-16);
}

.resumen-total {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-azul-900);
}

@media (max-width: 768px) {
  .filtros-historial {
    flex-direction: column;
    align-items: stretch;
  }

  .campo-busqueda,
  .campo-tipo,
  .campo-periodo {
    min-width: 100%;
  }
}
</style>