<template>
  <div id="app">
    <router-view v-slot="{ Component, meta }">
      <transition name="fade" mode="out-in">
        <component
          :is="Component"
          v-if="meta.publico"
        />
        <AppLayout v-else>
          <template #default>
            <component :is="Component" />
          </template>
        </AppLayout>
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<style>
#app {
  font-family: 'Roboto', sans-serif;
  background-color: var(--color-blanco);
  color: var(--color-negro);
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>