<template>
  <AppLayout>
    <template #default>
      <div class="historial-vista">
        <div class="vista-header">
          <h1 class="titulo-pagina">Historial de movimientos</h1>
          <p class="subtitulo-pagina">Consulte todas las operaciones de entrada y salida de stock.</p>
        </div>

        <MovementTable @registrar-movimiento="irRegistrarMovimiento" />
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import MovementTable from '@/components/inventory/MovementTable.vue'

const router = useRouter()

const irRegistrarMovimiento = () => {
  router.push({ name: 'registrar-movimiento' })
}
</script>

<style scoped>
.historial-vista {
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