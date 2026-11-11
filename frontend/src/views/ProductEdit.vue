<template>
  <div>
    <PageHeader
      v-if="producto"
      titulo="Editar producto"
      :subtitulo="`Actualizá los datos de ${producto.codigo}. El historial se conserva.`"
    />

    <LoadingState v-if="cargando" texto="Cargando producto…" />

    <Alert
      v-else-if="errorCarga"
      tipo="error"
      titulo="No pudimos cargar el producto"
      :mensaje="errorCarga"
    />

    <ProductForm v-else-if="producto" :producto="producto" :es-edicion="true" @guardado="volverAProductos" />

    <EmptyState
      v-else
      icono="buscar"
      titulo="No encontramos el producto"
      texto="El producto que buscás no existe o fue dado de baja."
    >
      <template #acciones>
        <Button variante="secundario" @click="volverAProductosSinEsperar">Volver a productos</Button>
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import { findProduct } from '@/services/store'

const route = useRoute()
const router = useRouter()

const producto = ref(null)
const cargando = ref(true)
const errorCarga = ref('')

onMounted(async () => {
  cargando.value = true
  errorCarga.value = ''

  try {
    producto.value = await findProduct(route.params.id)
  } catch (error) {
    errorCarga.value = 'Revisá tu conexión o volvé a intentarlo.'
  }

  cargando.value = false
})

const volverAProductos = () => {
  setTimeout(() => router.push({ name: 'productos' }), 1200)
}

const volverAProductosSinEsperar = () => router.push({ name: 'productos' })
</script>
