<template>
  <div class="app">
    <AppSidebar />

    <div class="contenido-app">
      <AppTopbar />

      <div class="barra-movil">
        <RouterLink class="marca" :to="{ name: 'panel' }" aria-label="Stoq, ir al panel">
          <span class="marca__texto">stoq</span><span class="marca__punto">.</span>
        </RouterLink>
        <p>
          {{ negocio.nombre }} <span class="separador">/</span>
          <strong>{{ seccion }}</strong>
        </p>
        <button
          type="button"
          class="enlace-tema"
          :aria-label="oscuro ? 'Activar modo claro' : 'Activar modo oscuro'"
          @click="toggleTheme"
        >
          <Icon :nombre="oscuro ? 'sol' : 'luna'" :tamano="16" />
        </button>
      </div>

      <main class="contenido-vista">
        <slot />
      </main>

      <AppFooter />
      <AppMobileNav />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AppMobileNav from '@/components/layout/AppMobileNav.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import Icon from '@/components/common/Icon.vue'
import { isDarkTheme, toggleTheme } from '@/services/store'
import { negocio } from '@/data/business'

const route = useRoute()
const seccion = computed(() => route.meta.seccion || 'Panel')
const oscuro = computed(() => isDarkTheme.value)
</script>
