<template>
  <div class="productos-page">
    <div class="page-header">
      <div class="page-title">
        <h1>Productos</h1>
        <p>Consulta, busca y filtra el catálogo de productos.</p>
      </div>
      <button class="btn-nuevo" @click="irNuevoProducto">
        + Nuevo producto
      </button>
    </div>

    <div class="buscador-filtros">
      <div class="campo-busqueda">
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar por nombre o SKU..."
          class="input-buscar"
        />
      </div>
      <div class="campo-filtro">
        <select v-model="filtroCategoria" class="select-filtro">
          <option value="todos">Categoría: Todos...</option>
          <option v-for="cat in categorias" :key="cat.id_categoria" :value="cat.id_categoria">
            Categoría: {{ cat.nombre }}...
          </option>
        </select>
      </div>
      <div class="campo-filtro">
        <select v-model="filtroStock" class="select-filtro">
          <option value="todos">Stock: Todos los estados...</option>
          <option value="bajo">Stock: Con stock bajo...</option>
          <option value="agotado">Stock: Agotado...</option>
        </select>
      </div>
    </div>

    <div class="resultados-info">
      <span>{{ productosFiltrados.length }} producto(s) encontrado(s)</span>
    </div>

    <table v-if="productosFiltrados.length > 0" class="tabla-productos">
      <thead>
        <tr>
          <th>Producto</th>
          <th>SKU</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in productosFiltrados" :key="p.id_producto">
          <td>
            <div class="celda-producto">
              <span class="nombre-producto">{{ p.nombre }}</span>
              <span v-if="p.descripcion" class="desc-producto">{{ p.descripcion }}</span>
            </div>
          </td>
          <td class="sku-producto">{{ p.codigo }}</td>
          <td>{{ getCategoryName(p.id_categoria) }}</td>
          <td class="precio-producto">{{ formatCurrency(p.precio) }}</td>
          <td class="stock-producto">{{ p.stock_actual }}</td>
          <td>
            <Badge
              v-if="p.stock_actual === 0"
              texto="Agotado"
              variante="stock-bajo"
            />
            <Badge v-else-if="isStockLow(p)" texto="Stock bajo" variante="stock-bajo" />
            <Badge v-else texto="OK" variante="stock-ok" />
          </td>
          <td class="acciones-producto">
            <button
              class="btn-accion btn-detalle"
              @click="irDetalle(p)"
              title="Detalle"
            >
              👁️
            </button>
            <button
              v-if="esAdmin"
              class="btn-accion btn-editar"
              @click="irEditar(p)"
              title="Editar"
            >
              ✏️
            </button>
            <button
              class="btn-accion btn-movimiento"
              @click="irMovimiento(p)"
              title="Movimiento"
            >
              🔄
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="estado-vacio">
      <div class="vacio-icon">📭</div>
      <p>No se encontraron productos.</p>
    </div>

    <div v-if="productosFiltrados.length > 0" class="paginacion">
      <span>1 - {{ productosFiltrados.length }} de {{ totalProductos }} · Página 1</span>
      <button class="btn-paginacion">Siguiendo →</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getProducts,
  getCategoryName,
  formatCurrency,
  isStockLow,
  isAdmin
} from '@/services/store'
import { categories } from '@/data/categories'
import Badge from '@/components/common/Badge.vue'

const router = useRouter()
const esAdmin = isAdmin()

const productos = ref(getProducts())
const busqueda = ref('')
const filtroCategoria = ref('todos')
const filtroStock = ref('todos')

const categorias = categories

const productosFiltrados = computed(() => {
  let resultado = productos.value

  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    resultado = resultado.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q)
    )
  }

  if (filtroCategoria.value !== 'todos') {
    resultado = resultado.filter(p => p.id_categoria === Number(filtroCategoria.value))
  }

  if (filtroStock.value === 'bajo') {
    resultado = resultado.filter(p => isStockLow(p) && p.stock_actual > 0)
  } else if (filtroStock.value === 'agotado') {
    resultado = resultado.filter(p => p.stock_actual === 0)
  }

  return resultado
})

const totalProductos = computed(() => productos.value.length)

const irNuevoProducto = () => router.push({ name: 'producto-nuevo' })
const irDetalle = (p) => router.push({ name: 'producto-detalle', params: { id: p.id_producto } })
const irEditar = (p) => router.push({ name: 'producto-editar', params: { id: p.id_producto } })
const irMovimiento = (p) => {
  router.push({ name: 'registrar-movimiento', query: { producto: p.id_producto } })
}
</script>

<style scoped>
.productos-page {
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

.btn-nuevo {
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

.btn-nuevo:hover {
  background-color: #1976D2;
}

.buscador-filtros {
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

.resultados-info {
  font-size: 13px;
  color: var(--color-gris-oscuro);
  margin-bottom: var(--espacio-16);
}

.tabla-productos {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-blanco);
  border-radius: var(--radio-borde);
  overflow: hidden;
  border: var(--borde-base);
}

.tabla-productos th {
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

.tabla-productos td {
  padding: var(--espacio-12) var(--espacio-16);
  border-bottom: 1px solid var(--color-gris-borde);
  font-size: 14px;
  color: var(--color-negro);
}

.tabla-productos tr:last-child td {
  border-bottom: none;
}

.tabla-productos tr:hover {
  background-color: var(--color-gris-fondo);
}

.celda-producto {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.nombre-producto {
  font-weight: 500;
  color: var(--color-negro);
}

.desc-producto {
  font-size: 12px;
  color: var(--color-gris-oscuro);
}

.sku-producto {
  font-family: 'Roboto', monospace;
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

.precio-producto {
  font-weight: 500;
  color: var(--color-azul-900);
}

.stock-producto {
  font-weight: 500;
}

.acciones-producto {
  display: flex;
  gap: var(--espacio-6);
}

.btn-accion {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radio-borde);
  background-color: var(--color-gris-fondo);
  color: var(--color-gris-oscuro);
  cursor: pointer;
  font-size: 16px;
}

.btn-accion:hover {
  background-color: var(--color-azul-50);
  color: var(--color-azul-900);
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
  .productos-page {
    padding: var(--espacio-16);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--espacio-16);
  }

  .buscador-filtros {
    flex-direction: column;
    align-items: stretch;
  }

  .campo-busqueda,
  .campo-filtro {
    min-width: 100%;
  }

  .acciones-producto {
    flex-direction: column;
  }

  .btn-accion {
    width: 100%;
    justify-content: flex-start;
    padding: var(--espacio-8) var(--espacio-12);
    font-size: 14px;
  }
}
</style>