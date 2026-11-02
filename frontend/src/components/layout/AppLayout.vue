<template>
  <div class="app-layout">
    <Sidebar />
    <Navbar />
    <main class="contenido-principal">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.contenido-principal {
  flex: 1;
  margin-left: 260px;
  padding: var(--espacio-24);
  background-color: var(--color-gris-fondo);
  min-height: 100vh;
}

@media (max-width: 768px) {
  .contenido-principal {
    margin-left: 0;
    padding: var(--espacio-16);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>