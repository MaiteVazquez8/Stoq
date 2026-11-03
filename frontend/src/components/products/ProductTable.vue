<template>
  <div>
    <!-- Tabla (escritorio) -->
    <table v-if="!esMovil" class="tabla tabla-escritorio">
      <thead>
        <tr>
          <th scope="col">Producto / SKU</th>
          <th scope="col">Categoría</th>
          <th scope="col" class="celda-numero">Stock</th>
          <th scope="col">Estado</th>
          <th scope="col"><span class="oculto-visualmente">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productos" :key="producto.id_producto">
          <td>
            <div class="fila-principal">
              <span class="celda-titulo">{{ producto.nombre }}</span>
              <span class="celda-sub">{{ producto.codigo }}</span>
            </div>
          </td>
          <td class="celda-sub">{{ getCategoryName(producto.id_categoria) }}</td>
          <td class="celda-numero">
            <div class="fila-principal">
              <span class="stock-valor">{{ formatUnidades(producto.stock_actual) }}</span>
              <span class="celda-sub">mín. {{ producto.stock_minimo }}</span>
            </div>
          </td>
          <td><Badge :estado="estadoStock(producto)" /></td>
          <td class="celda-acciones">
            <AccionesFila
              :producto="producto"
              :abierto="menuAbiertoId === producto.id_producto"
              @alternar="alternarMenu(producto.id_producto)"
              @ver="emitir('ver', producto)"
              @editar="emitir('editar', producto)"
              @movimiento="emitir('movimiento', producto)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Tarjetas (móvil) -->
    <ul v-if="esMovil" class="lista-tarjetas">
      <li v-for="producto in productos" :key="`tarjeta-${producto.id_producto}`" class="tarjeta-producto">
        <div class="fila fila--separada">
          <div class="fila-principal">
            <span class="celda-titulo">{{ producto.nombre }}</span>
            <span class="celda-sub">{{ producto.codigo }} · {{ getCategoryName(producto.id_categoria) }}</span>
          </div>
          <AccionesFila
            :producto="producto"
            :abierto="menuAbiertoId === producto.id_producto"
            @alternar="alternarMenu(producto.id_producto)"
            @ver="emitir('ver', producto)"
            @editar="emitir('editar', producto)"
            @movimiento="emitir('movimiento', producto)"
          />
        </div>

        <p class="texto-cuerpo">{{ formatUnidadesLargas(producto.stock_actual) }} · mínimo {{ producto.stock_minimo }}</p>
        <Badge :estado="estadoStock(producto)" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Badge from '@/components/common/Badge.vue'
import AccionesFila from '@/components/products/ProductRowActions.vue'
import { getCategoryName } from '@/data/categories'
import { formatUnidades, formatUnidadesLargas } from '@/utils/format'
import { estadoStock } from '@/services/analytics'
import { useEsMovil } from '@/utils/useEsMovil'

defineProps({
  productos: { type: Array, required: true }
})

const emit = defineEmits(['ver', 'editar', 'movimiento'])

const { esMovil } = useEsMovil()
const menuAbiertoId = ref(null)

const alternarMenu = (id) => {
  menuAbiertoId.value = menuAbiertoId.value === id ? null : id
}

const emitir = (tipo, producto) => {
  menuAbiertoId.value = null
  emit(tipo, producto)
}

const cerrarMenus = () => {
  menuAbiertoId.value = null
}

const alPresionarTecla = (evento) => {
  if (evento.key === 'Escape') cerrarMenus()
}

onMounted(() => {
  document.addEventListener('click', cerrarMenus)
  document.addEventListener('keydown', alPresionarTecla)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', cerrarMenus)
  document.removeEventListener('keydown', alPresionarTecla)
})
</script>

<style scoped>
.lista-tarjetas {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tarjeta-producto {
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
  padding: var(--esp-16);
  background-color: var(--superficie);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.tarjeta-producto + .tarjeta-producto {
  margin-top: var(--esp-12);
}

.stock-valor {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .tabla-escritorio {
    display: none;
  }

  .lista-tarjetas {
    display: block;
  }
}
</style>
