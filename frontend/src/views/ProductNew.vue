<template>
  <div class="producto-form-page">
    <div class="page-header">
      <button class="btn-volver" @click="volver">
        ← Volver a productos
      </button>
      <div class="info-form">
        <h1>Nuevo producto</h1>
        <p>Registra un nuevo producto en el catálogo. Los campos con * son obligatorios.</p>
      </div>
    </div>

    <ProductForm :es-editar="false" @guardar="volverAProductos" @cancelar="volver" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ProductForm from '@/components/products/ProductForm.vue'

const router = useRouter()

const volver = () => router.push({ name: 'productos' })
const volverAProductos = () => {
  router.push({ name: 'productos' })
}
</script>

<style scoped>
.producto-form-page {
  max-width: 800px;
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

.btn-volver {
  padding: var(--espacio-10) var(--espacio-16);
  font-family: var(--fuente-principal);
  font-size: 14px;
  color: var(--color-azul-500);
  background: none;
  border: 1px solid var(--color-azul-500);
  border-radius: var(--radio-borde);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--espacio-6);
}

.btn-volver:hover {
  background-color: var(--color-azul-50);
}

.info-form h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin: 0 0 var(--espacio-8) 0;
}

.info-form p {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  margin: 0;
}
</style>