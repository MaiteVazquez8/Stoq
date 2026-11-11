import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin, sessionReady } from '@/services/store'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import ProductList from '@/views/ProductList.vue'
import ProductNew from '@/views/ProductNew.vue'
import ProductEdit from '@/views/ProductEdit.vue'
import ProductDetail from '@/views/ProductDetail.vue'
import MovementRegister from '@/views/MovementRegister.vue'
import MovementHistory from '@/views/MovementHistory.vue'
import InventoryTracking from '@/views/InventoryTracking.vue'
import CategoryList from '@/views/CategoryList.vue'
import Proveedores from '@/views/Proveedores.vue'
import Reposiciones from '@/views/Reposiciones.vue'
import Informes from '@/views/Informes.vue'

const routes = [
  {
    path: '/',
    name: 'inicio',
    component: Home,
    meta: { publico: true, seccion: 'Inicio' }
  },
  {
    path: '/ingresar',
    name: 'ingresar',
    component: Login,
    meta: { publico: true, seccion: 'Ingreso' }
  },
  {
    path: '/panel',
    name: 'panel',
    component: Dashboard,
    meta: { seccion: 'Panel' }
  },
  {
    path: '/productos',
    name: 'productos',
    component: ProductList,
    meta: { seccion: 'Productos' }
  },
  {
    path: '/productos/nuevo',
    name: 'producto-nuevo',
    component: ProductNew,
    meta: { seccion: 'Productos', requiereAdmin: true }
  },
  {
    path: '/productos/:id',
    name: 'producto-detalle',
    component: ProductDetail,
    meta: { seccion: 'Productos' }
  },
  {
    path: '/productos/:id/editar',
    name: 'producto-editar',
    component: ProductEdit,
    meta: { seccion: 'Productos', requiereAdmin: true }
  },
  {
    path: '/categorias',
    name: 'categorias',
    component: CategoryList,
    meta: { seccion: 'Categorías', requiereAdmin: true }
  },
  {
    path: '/proveedores',
    name: 'proveedores',
    component: Proveedores,
    meta: { seccion: 'Proveedores', requiereAdmin: true }
  },
  {
    path: '/reposiciones',
    name: 'reposiciones',
    component: Reposiciones,
    meta: { seccion: 'Reposiciones', requiereAdmin: true }
  },
  {
    path: '/informes',
    name: 'informes',
    component: Informes,
    meta: { seccion: 'Informes', requiereAdmin: true }
  },
  {
    path: '/movimientos',
    name: 'movimientos',
    component: MovementHistory,
    meta: { seccion: 'Movimientos' }
  },
  {
    path: '/movimientos/registrar',
    name: 'movimiento-registrar',
    component: MovementRegister,
    meta: { seccion: 'Movimientos' }
  },
  {
    path: '/inventario',
    name: 'inventario',
    component: InventoryTracking,
    meta: { seccion: 'Inventario' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: { name: 'inicio' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  // Esperar a conocer el estado real de la sesión (RN01)
  await sessionReady

  const autenticado = isAuthenticated.value

  if (to.meta.publico) {
    if (autenticado && to.name === 'ingresar') {
      return { name: 'panel' }
    }
    return true
  }

  if (!autenticado) {
    return { name: 'ingresar' }
  }

  if (to.meta.requiereAdmin && !isAdmin.value) {
    return { name: 'panel' }
  }

  return true
})

export default router
