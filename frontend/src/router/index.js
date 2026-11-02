import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getCurrentUser } from '@/services/store'

import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import ProductList from '@/views/ProductList.vue'
import ProductNew from '@/views/ProductNew.vue'
import ProductEdit from '@/views/ProductEdit.vue'
import ProductDetail from '@/views/ProductDetail.vue'
import MovementRegister from '@/views/MovementRegister.vue'
import MovementHistory from '@/views/MovementHistory.vue'
import InventoryTracking from '@/views/InventoryTracking.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiereAutenticacion: false, publico: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/productos',
    name: 'productos',
    component: ProductList,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/productos/nuevo',
    name: 'producto-nuevo',
    component: ProductNew,
    meta: { requiereAutenticacion: true, requiereAdmin: true }
  },
  {
    path: '/productos/:id/editar',
    name: 'producto-editar',
    component: ProductEdit,
    meta: { requiereAutenticacion: true, requiereAdmin: true }
  },
  {
    path: '/productos/:id',
    name: 'producto-detalle',
    component: ProductDetail,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/movimientos/registrar',
    name: 'registrar-movimiento',
    component: MovementRegister,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/movimientos/historial',
    name: 'historial-movimientos',
    component: MovementHistory,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/inventario',
    name: 'inventario',
    component: InventoryTracking,
    meta: { requiereAutenticacion: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: { name: 'login' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guardia de navegación simulada
router.beforeEach((to, from, next) => {
  const autenticado = isAuthenticated.value

  if (to.meta.requiereAutenticacion && !autenticado) {
    next({ name: 'login' })
    return
  }

  if (to.meta.publico && autenticado) {
    next({ name: 'dashboard' })
    return
  }

  // Verificar permisos de administrador
  if (to.meta.requiereAdmin) {
    const usuario = getCurrentUser()
    if (!usuario || usuario.id_rol !== 1) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
