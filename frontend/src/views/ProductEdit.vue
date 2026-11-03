<template>
  <div>
    <PageHeader
      v-if="producto"
      titulo="Editar producto"
      :subtitulo="`Actualizá los datos de ${producto.codigo}. El historial se conserva.`"
    />

    <ProductForm v-if="producto" :producto="producto" :es-edicion="true" @guardado="volverAProductos" />

    <EmptyState
      v-else
      icono="buscar"
      titulo="No encontramos el producto"
      texto="El producto que buscás no existe o fue dado de baja."
    >
      <template #acciones>
        <Button variante="secundario" @click="volverAProductos">Volver a productos</Button>
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import { findProduct } from '@/services/store'

const route = useRoute()
const router = useRouter()

const producto = computed(() => findProduct(route.params.id))

const volverAProductos = () => {
  setTimeout(() => router.push({ name: 'productos' }), 1200)
}
</script>
