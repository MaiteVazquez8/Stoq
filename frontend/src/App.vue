<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="fade" mode="out-in">
      <Component :is="Component" v-if="route.meta.publico" key="publico" />
      <AppLayout v-else key="app">
        <Component :is="Component" />
      </AppLayout>
    </Transition>
  </RouterView>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
