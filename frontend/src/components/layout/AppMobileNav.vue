<template>
  <nav class="nav-inferior" aria-label="Navegación principal">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      class="nav-inferior__item"
      :class="{ 'nav-inferior__item--activo': esActiva(item) }"
      :to="{ name: item.name }"
    >
      <Icon :nombre="item.icono" :tamano="20" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/common/Icon.vue'
import { isAdmin } from '@/services/store'

const route = useRoute()

const items = computed(() => {
  const base = [
    { name: 'panel', label: 'Panel', icono: 'panel', coincidencias: ['panel'] },
    { name: 'productos', label: 'Productos', icono: 'productos', coincidencias: ['productos', 'producto-nuevo', 'producto-detalle', 'producto-editar'] },
    { name: 'movimientos', label: 'Movimientos', icono: 'movimientos', coincidencias: ['movimientos', 'movimiento-registrar'] },
    { name: 'inventario', label: 'Inventario', icono: 'inventario', coincidencias: ['inventario'] }
  ]

  if (isAdmin.value) {
    base.push({ name: 'categorias', label: 'Categorías', icono: 'etiqueta', coincidencias: ['categorias'] })
  }

  return base
})

const esActiva = (item) => item.coincidencias.includes(route.name)
</script>
