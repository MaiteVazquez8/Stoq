<template>
  <div class="producto-lista">
    <div class="lista-header">
      <h2 class="titulo-seccion">Productos</h2>
      <button class="btn btn-principal btn-pequeno" @click="$emit('nuevo-producto')">
        + Nuevo producto
      </button>
    </div>

    <div class="busqueda-filtros">
      <div class="campo-busqueda">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          v-model="busqueda"
          @input="debouncedBuscar"
        />
      </div>
      <div class="campo-categoria">
        <select v-model="filtroCategoria" @change="aplicarFiltro">
          <option value="todos">Todas las categorías</option>
          <option v-for="cat in categorias" :key="cat.id_categoria" :value="cat.id_categoria">
            {{ cat.nombre }}
          </option>
        </select>
      </div>
      <div class="campo-estado">
        <select v-model="filtroEstado" @change="aplicarFiltro">
          <option value="todos">Todos los estados</option>
          <option value="stock-bajo">Con stock bajo</option>
        </select>
      </div>
    </div>

    <Alert
      v-if="alerta && !esAdmin"
      tipo="advertencia"
      mensaje="Algunas acciones requieren permisos de administrador."
    />

    <div v-if="productosFiltrados.length === 0" class="estado-vacio">
      <div class="icono-vacio">📭</div>
      <p>No se encontraron productos.</p>
      <button v-if="esAdmin" class="btn btn-principal btn-pequeno" @click="$emit('nuevo-producto')">
        Registrar primer producto
      </button>
    </div>

    <table v-else class="tabla">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Código</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th class="celda-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productosFiltrados" :key="producto.id_producto">
          <td>
            <div class="producto-info">
              <span class="producto-nombre">{{ producto.nombre }}</span>
              <span v-if="producto.descripcion" class="producto-descripcion">
                {{ producto.descripcion }}
              </span>
            </div>
          </td>
          <td class="producto-codigo">{{ producto.codigo }}</td>
          <td>{{ getCategoryName(producto.id_categoria) }}</td>
          <td>{{ formatCurrency(producto.precio) }}</td>
          <td>
            <Badge
              :texto="producto.stock_actual"
              :variante="isStockLow(producto) ? 'stock-bajo' : 'stock-ok'"
            />
          </td>
          <td class="celda-acciones">
            <button
              class="btn btn-outline btn-pequeno"
              @click="$emit('ver-detalle', producto)"
            >
              Detalle
            </button>
            <button
              v-if="esAdmin"
              class="btn btn-secundario btn-pequeno"
              @click="$emit('editar-producto', producto)"
            >
              Editar
            </button>
            <button
              class="btn btn-principal btn-pequeno"
              @click="$emit('registrar-movimiento', producto)"
            >
              Movimiento
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="productosFiltrados.length > 0" class="paginacion">
      <span>Mostrando {{ productosFiltrados.length }} producto(s)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, formatCurrency, isStockLow, getCategoryName } from '@/services/store'
import { categories } from '@/data/categories'
import Alert from '@/components/common/Alert.vue'
import Badge from '@/components/common/Badge.vue'

const props = defineProps({
  esAdmin: { type: Boolean, default: false }
})

const emit = defineEmits(['nuevo-producto', 'ver-detalle', 'editar-producto', 'registrar-movimiento'])

const busqueda = ref('')
const filtroCategoria = ref('todos')
const filtroEstado = ref('todos')

const categorias = categories
const todosProductos = ref(getProducts())
const alerta = ref(true)

const debouncedBuscar = (e) => {
  busqueda.value = e.target.value
}

const aplicarFiltro = () => {
  // Los filtros se aplican reactivamente a través de productosFiltrados
}

const productosFiltrados = computed(() => {
  let resultado = todosProductos.value

  // Filtro por búsqueda (nombre o código)
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    resultado = resultado.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q)
    )
  }

  // Filtro por categoría
  if (filtroCategoria.value !== 'todos') {
    resultado = resultado.filter(p => p.id_categoria === Number(filtroCategoria.value))
  }

  // Filtro por estado (stock bajo)
  if (filtroEstado.value === 'stock-bajo') {
    resultado = resultado.filter(p => isStockLow(p))
  }

  return resultado
})
</script>

<style scoped>
.producto-lista {
  max-width: 1000px;
  margin: 0 auto;
}

.lista-header {
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

.busqueda-filtros {
  display: flex;
  gap: var(--espacio-12);
  margin-bottom: var(--espacio-20);
  flex-wrap: wrap;
  align-items: center;
}

.campo-busqueda {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.campo-busqueda input {
  width: 100%;
  padding: var(--espacio-12) var(--espacio-16) var(--espacio-12) 40px;
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
}

.campo-categoria,
.campo-estado {
  min-width: 200px;
}

.campo-categoria select,
.campo-estado select {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
}

.producto-info {
  display: flex;
  flex-direction: column;
}

.producto-nombre {
  font-weight: 500;
  color: var(--color-negro);
}

.producto-descripcion {
  font-size: 12px;
  color: var(--color-gris-oscuro);
  margin-top: var(--espacio-4);
}

.producto-codigo {
  font-family: 'Roboto', monospace;
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

@media (max-width: 768px) {
  .busqueda-filtros {
    flex-direction: column;
    align-items: stretch;
  }

  .campo-busqueda,
  .campo-categoria,
  .campo-estado {
    min-width: 100%;
  }

  .celda-acciones {
    display: flex;
    gap: var(--espacio-6);
    flex-wrap: wrap;
  }

  .celda-acciones .btn {
    flex: 1;
  }
}
</style>