<template>
  <header class="topbar">
    <p class="topbar__ruta">
      <span>{{ negocio.nombre }}</span>
      <span class="separador">/</span>
      <strong>{{ seccion }}</strong>
      <span class="separador">·</span>
      <span>{{ usuario ? usuario.nombre.split(' ')[0] : 'Invitada' }}</span>
      <span class="separador">·</span>
      <button type="button" class="enlace-tema" @click="cambiarTema">
        <Icon :nombre="oscuro ? 'sol' : 'luna'" :tamano="14" />
        {{ oscuro ? 'Modo oscuro' : 'Modo claro' }}
      </button>
    </p>

    <div class="topbar__acciones">
      <button
        type="button"
        class="enlace-tema"
        :aria-expanded="menuAbierto ? 'true' : 'false'"
        @click="menuAbierto = !menuAbierto"
      >
        {{ usuario ? usuario.nombre : 'Invitada' }}
        <Icon nombre="chevron-abajo" :tamano="14" />
      </button>
    </div>

    <div v-if="menuAbierto" ref="menu" class="menu-contextual menu-usuario">
      <p class="menu-contextual__titulo">{{ rolNombre }} · {{ negocio.etiqueta }}</p>
      <button type="button" class="menu-contextual__opcion" @click="cerrarSesion">
        <Icon nombre="cerrar-sesion" :tamano="18" class="menu-contextual__check" />
        Cerrar sesión
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/common/Icon.vue'
import { getCurrentUser, getUserRoleName, isDarkTheme, logout, toggleTheme } from '@/services/store'
import { negocio } from '@/data/business'

const route = useRoute()
const router = useRouter()
const menuAbierto = ref(false)
const menu = ref(null)

const usuario = computed(() => getCurrentUser())
const rolNombre = computed(() => getUserRoleName())
const oscuro = computed(() => isDarkTheme.value)

const seccion = computed(() => route.meta.seccion || 'Panel')

const cambiarTema = () => toggleTheme()

const cerrarSesion = async () => {
  menuAbierto.value = false
  await logout()
  router.push({ name: 'ingresar' })
}

const alHacerClicAfuera = (evento) => {
  if (menuAbierto.value && menu.value && !menu.value.contains(evento.target)) {
    menuAbierto.value = false
  }
}

onMounted(() => document.addEventListener('click', alHacerClicAfuera))
onBeforeUnmount(() => document.removeEventListener('click', alHacerClicAfuera))
</script>

<style scoped>
.menu-usuario {
  top: 56px;
  right: var(--esp-24);
}

@media (max-width: 768px) {
  .menu-usuario {
    right: var(--esp-16);
  }
}
</style>
