<template>
  <RouterView v-slot="{ Component, route }">
    <Component :is="Component" v-if="route.meta.publico" key="publico" />
    <AppLayout v-else key="app">
      <Component :is="Component" />
    </AppLayout>
  </RouterView>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
