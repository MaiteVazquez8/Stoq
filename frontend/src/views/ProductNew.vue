<template>
  <div>
    <PageHeader
      titulo="Nuevo producto"
      subtitulo="Sumá un producto a tu catálogo. Los campos con * son obligatorios."
    />

    <ProductForm :es-edicion="false" @guardado="volverAProductos" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import ProductForm from '@/components/products/ProductForm.vue'

const router = useRouter()

const volverAProductos = () => {
  setTimeout(() => router.push({ name: 'productos' }), 1200)
}
</script>
