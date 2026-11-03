<template>
  <div>
    <PageHeader
      titulo="Registrar movimiento"
      subtitulo="Cada entrada o salida actualiza el stock y queda en el historial."
    />

    <MovementForm :producto-preseleccionado="productoPreseleccionado" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import MovementForm from '@/components/inventory/MovementForm.vue'

const route = useRoute()

const productoPreseleccionado = computed(() => route.query.producto || null)
</script>
