<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// No imports needed at app level; routing is handled by router guards
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