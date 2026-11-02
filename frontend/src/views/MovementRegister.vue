<template>
  <AppLayout>
    <template #default>
      <div class="movimiento-vista">
        <div class="vista-header">
          <button class="btn btn-secundario btn-pequeno" @click="volver">
            ← Volver a productos
          </button>
          <h1 class="titulo-pagina">Registrar movimiento</h1>
        </div>

        <MovementForm
          :producto-preseleccionado="productoPreseleccionado"
          @movimiento-registrado="volverAProductos"
          @cancelar="volver"
        />
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import MovementForm from '@/components/inventory/MovementForm.vue'

const route = useRoute()
const router = useRouter()

const productoPreseleccionado = route.query.producto ? Number(route.query.producto) : null

const volver = () => router.push({ name: 'productos' })
const volverAProductos = () => {
  router.push({ name: 'productos' })
}
</script>

<style scoped>
.movimiento-vista {
  max-width: 800px;
  margin: 0 auto;
}

.vista-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--espacio-24);
}

.titulo-pagina {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin: 0;
}
</style>