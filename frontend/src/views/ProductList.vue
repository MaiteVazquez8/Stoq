<template>
  <AppLayout>
    <template #default>
      <div class="productos-vista">
        <div class="vista-header">
          <h1 class="titulo-pagina">Productos</h1>
          <p class="subtitulo-pagina">Consulte y gestione el catálogo de productos.</p>
        </div>

        <ProductTable
          :es-admin="esAdmin"
          @nuevo-producto="irNuevoProducto"
          @ver-detalle="irDetalleProducto"
          @editar-producto="irEditarProducto"
          @registrar-movimiento="irRegistrarMovimiento"
        />
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAdmin, getCurrentUser } from '@/services/store'
import AppLayout from '@/components/layout/AppLayout.vue'
import ProductTable from '@/components/products/ProductTable.vue'

const router = useRouter()
const usuario = getCurrentUser()
const esAdmin = computed(() => isAdmin())

const irNuevoProducto = () => router.push({ name: 'producto-nuevo' })
const irDetalleProducto = (producto) => router.push({ name: 'producto-detalle', params: { id: producto.id_producto } })
const irEditarProducto = (producto) => router.push({ name: 'producto-editar', params: { id: producto.id_producto } })
const irRegistrarMovimiento = (producto) => {
  router.push({ name: 'registrar-movimiento', query: { producto: producto.id_producto } })
}
</script>

<style scoped>
.productos-vista {
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
</style>