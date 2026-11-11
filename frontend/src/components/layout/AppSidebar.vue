<template>
  <aside class="sidebar">
    <div>
      <RouterLink class="marca" :to="{ name: 'panel' }" aria-label="Stoq, ir al panel">
        <span class="marca__texto">stoq</span><span class="marca__punto">.</span>
      </RouterLink>
      <p class="sidebar__negocio">{{ negocio.nombre }}</p>
    </div>

    <nav class="nav-lateral" aria-label="Navegación principal">
      <RouterLink
        v-for="item in items"
        :key="item.name"
        class="nav-lateral__item"
        :class="{ 'nav-lateral__item--activo': esActiva(item) }"
        :to="{ name: item.name }"
      >
        <Icon :nombre="item.icono" :tamano="18" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/common/Icon.vue'
import { isAdmin } from '@/services/store'
import { negocio } from '@/data/business'

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
