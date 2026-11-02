<template>
  <header class="navbar">
    <div class="navbar-contenido">
      <button class="btn-menu-mobile" @click="toggleSidebar">
        ☰
      </button>

      <div class="navbar-centro">
        <img src="@/assets/images/logo-stoq.png" alt="Stoq" class="logo-navbar" />
        <span class="app-subtitulo">Sistema de gestión de stock</span>
      </div>

      <div class="navbar-derecha">
        <span class="usuario-info" v-if="usuario">
          {{ usuario.nombre }}
        </span>
        <button class="btn btn-secundario btn-pequeno" @click="toggleTheme" title="Cambiar tema">
          {{ darkMode() ? '☀️' : '🌙' }}
        </button>
        <button class="btn btn-secundario btn-pequeno" @click="cerrarSesion">
          Cerrar sesión
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { getCurrentUser, toggleTheme, getTheme } from '@/services/store'

const router = useRouter()
const usuario = getCurrentUser()
const darkMode = getTheme

const toggleSidebar = () => {
  document.body.classList.toggle('sidebar-abierto')
}

const cerrarSesion = () => {
  router.push({ name: 'login' })
}
</script>

<style scoped>
.navbar {
  height: 64px;
  background-color: var(--color-blanco);
  border-bottom: var(--borde-base);
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 0 var(--espacio-24);
}

.navbar-contenido {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--espacio-16);
}

.btn-menu-mobile {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-negro);
  padding: var(--espacio-8);
}

@media (max-width: 768px) {
  .btn-menu-mobile {
    display: block;
  }
}

.navbar-centro {
  display: flex;
  align-items: center;
  gap: var(--espacio-12);
  flex: 1;
}

.app-titulo {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-azul-900);
  letter-spacing: -0.5px;
}

.logo-navbar {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-right: var(--espacio-8);
}

.app-subtitulo {
  font-size: 12px;
  color: var(--color-gris-texto);
}

.navbar-derecha {
  display: flex;
  align-items: center;
  gap: var(--espacio-12);
}

.usuario-info {
  font-size: 13px;
  color: var(--color-gris-oscuro);
}

@media (max-width: 768px) {
  .navbar-derecha {
    gap: var(--espacio-8);
  }

  .usuario-info {
    display: none;
  }
}
</style>