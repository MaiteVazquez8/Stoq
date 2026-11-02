<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="@/assets/images/logo-stoq.png" alt="Stoq" class="logo-imagen" />
    </div>

    <nav class="sidebar-nav">
      <a
        v-for="item in items"
        :key="item.name"
        :class="['nav-link', { activo: $route.name === item.name }]"
        @click="cerrarMenuMobile"
        :to="{ name: item.name }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-texto">{{ item.label }}</span>
      </a>
    </nav>

    <div class="sidebar-perfil" v-if="usuario">
      <div class="perfil-info">
        <span class="perfil-nombre">{{ usuario.nombre }}</span>
        <span class="perfil-rol">{{ rolNombre }}</span>
      </div>
      <button class="btn btn-secundario btn-pequeno btn-cerrar-sesion" @click="cerrarSesion">
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '@/services/store'
import { roles } from '@/data/roles'

const router = useRouter()
const usuario = getCurrentUser()

const rolNombre = computed(() => {
  if (!usuario) return ''
  const rol = roles.find(r => r.id_rol === usuario.id_rol)
  return rol ? rol.nombre : ''
})

const items = [
  { name: 'dashboard', label: 'Panel', icon: '📊' },
  { name: 'productos', label: 'Productos', icon: '📦' },
  { name: 'registrar-movimiento', label: 'Movimientos', icon: '🔄' },
  { name: 'historial-movimientos', label: 'Historial', icon: '📋' },
  { name: 'inventario', label: 'Inventario', icon: '📈' }
]

const cerrarSesion = () => {
  router.push({ name: 'login' })
}

const cerrarMenuMobile = () => {
  document.body.classList.remove('sidebar-abierto')
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background-color: var(--color-blanco);
  border-right: var(--borde-base);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar-abierto {
    transform: translateX(0);
  }
}

.sidebar-brand {
  padding: var(--espacio-24);
  border-bottom: var(--borde-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-imagen {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.sidebar-nav {
  padding: var(--espacio-24) var(--espacio-16);
  flex: 1;
  overflow-y: auto;
}

.nav-link {
  width: 100%;
  padding: var(--espacio-12) var(--espacio-16);
  margin-bottom: var(--espacio-6);
  border-radius: var(--radio-borde);
  display: flex;
  align-items: center;
  gap: var(--espacio-12);
  color: var(--color-gris-oscuro);
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  text-align: left;
}

.nav-link:hover {
  background-color: var(--color-gris-fondo);
  color: var(--color-azul-900);
  text-decoration: none;
}

.nav-link.activo {
  background-color: var(--color-azul-50);
  color: var(--color-azul-900);
  border: 1px solid var(--color-azul-200);
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.sidebar-perfil {
  padding: var(--espacio-24);
  border-top: var(--borde-base);
}

.perfil-info {
  margin-bottom: var(--espacio-16);
}

.perfil-nombre {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
}

.perfil-rol {
  display: block;
  font-size: 12px;
  color: var(--color-gris-texto);
  margin-top: var(--espacio-4);
}

.btn-cerrar-sesion {
  width: 100%;
}
</style>