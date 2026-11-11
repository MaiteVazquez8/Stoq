// ============================================================================
// Stoq · Store principal (autenticación + datos compartidos + tema)
// ============================================================================
// Mantiene en memoria reactiva la sesión y los catálogos compartidos
// (productos y categorías), de modo que todas las vistas se actualicen
// automáticamente después de cada operación sobre Supabase.
//
// Las operaciones CRUD viven en los servicios (services/products.js,
// services/categories.js, services/movements.js); este módulo las expone
// con control de permisos del lado del cliente. La seguridad real está en
// Supabase (RLS + funciones RPC), no en estos chequeos.
// ============================================================================

import { ref, computed } from 'vue'
import { supabase } from './supabase'
import {
  iniciarSesion as authIniciarSesion,
  cerrarSesion as authCerrarSesion,
  normalizarPerfil,
  obtenerPerfilPorAuthId
} from './auth'
import * as productService from './products'
import * as categoryService from './categories'
import * as movementService from './movements'

const ROLES = {
  ADMIN: 1,
  OPERADOR: 2
}

const MOTIVOS_ENTRADA = [
  'Entrada de proveedor',
  'Producción terminada',
  'Devolución de cliente',
  'Ajuste de inventario'
]

const MOTIVOS_SALIDA = [
  'Entrega de pedidos',
  'Venta en local',
  'Producción intermedia',
  'Ajuste de inventario'
]

// ----------------------------------------------------------------------------
// Sesión (sincronizada con Supabase Auth)
// ----------------------------------------------------------------------------
const currentUser = ref(null)
const sessionLoading = ref(true)

let resolverSesionInicial
export const sessionReady = new Promise((resolve) => {
  resolverSesionInicial = resolve
})

const aplicarSesion = async (sesion) => {
  try {
    if (sesion?.user) {
      const { data: perfil } = await obtenerPerfilPorAuthId(sesion.user.id)
      currentUser.value = perfil
        ? normalizarPerfil(perfil, sesion.user.email)
        : { id: sesion.user.id, email: sesion.user.email, nombre: sesion.user.email, id_rol: 2, estado: 'activo' }
    } else {
      currentUser.value = null
    }
  } catch (error) {
    console.error('[Stoq] No se pudo resolver el perfil de la sesión:', error)
    currentUser.value = sesion?.user
      ? { id: sesion.user.id, email: sesion.user.email, nombre: sesion.user.email, id_rol: 2, estado: 'activo' }
      : null
  } finally {
    sessionLoading.value = false
    resolverSesionInicial()
  }
}

supabase.auth.onAuthStateChange((_evento, sesion) => {
  aplicarSesion(sesion)
})

// Fallback: si el evento inicial no llegara (red caída al arrancar),
// evitamos que las guardas de navegación queden esperando para siempre.
setTimeout(() => {
  if (sessionLoading.value) {
    sessionLoading.value = false
    resolverSesionInicial()
  }
}, 5000)

export const isAuthenticated = computed(() => currentUser.value !== null)
export const isAdmin = computed(() => currentUser.value?.id_rol === ROLES.ADMIN)
export const isOperador = computed(() => currentUser.value?.id_rol === ROLES.OPERADOR)

export const getCurrentUser = () => currentUser.value

export const getUserRoleName = () => {
  if (!currentUser.value) return ''
  return currentUser.value.id_rol === ROLES.ADMIN ? 'Administrador' : 'Operador'
}

export const login = async (email, password) => {
  const resultado = await authIniciarSesion({ email, password })
  if (resultado.success && resultado.user) {
    currentUser.value = resultado.user
  }
  return resultado
}

export const logout = async () => {
  const resultado = await authCerrarSesion()
  currentUser.value = null
  return resultado
}

export const getMovementMotives = (tipo) =>
  tipo === 'Entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA

// ----------------------------------------------------------------------------
// Tema claro/oscuro (persistido en localStorage)
// ----------------------------------------------------------------------------
const CLAVE_TEMA = 'stoq-tema-oscuro'
const temaInicial =
  typeof window !== 'undefined' && window.localStorage?.getItem(CLAVE_TEMA) === '1'

const isDarkMode = ref(temaInicial)

if (typeof document !== 'undefined') {
  document.body.classList.toggle('dark', isDarkMode.value)
}

export const isDarkTheme = computed(() => isDarkMode.value)

export const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(CLAVE_TEMA, isDarkMode.value ? '1' : '0')
  }
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark', isDarkMode.value)
  }
  return isDarkMode.value
}

// ----------------------------------------------------------------------------
// Datos compartidos: productos y categorías
// ----------------------------------------------------------------------------
const productos = ref([])
const categorias = ref([])
const cargandoProductos = ref(false)
const cargandoCategorias = ref(false)

export const productosCompartidos = computed(() => productos.value)
export const categoriasCompartidas = computed(() => categorias.value)
export const getProductosActivos = computed(() => productos.value.filter((p) => p.activo))

export const cargarProductos = async () => {
  cargandoProductos.value = true
  const resultado = await productService.getProducts()
  if (!resultado.error) {
    productos.value = resultado.data ?? []
  }
  cargandoProductos.value = false
  return resultado
}

export const cargarCategorias = async () => {
  cargandoCategorias.value = true
  const resultado = await categoryService.getCategories()
  if (!resultado.error) {
    categorias.value = resultado.data ?? []
  }
  cargandoCategorias.value = false
  return resultado
}

// --- Productos ---
export const findProduct = async (idProducto) => {
  const resultado = await productService.getProductById(Number(idProducto))
  return resultado.data ?? null
}

export const findProductByCode = async (codigo, exceptoId = null) => {
  const resultado = await productService.getProductByCode(codigo)
  if (!resultado.data) return null
  if (exceptoId !== null && resultado.data.id_producto === Number(exceptoId)) return null
  return resultado.data
}

export const createProduct = async (datos) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para registrar productos.' }
  }
  const resultado = await productService.createProduct(datos)
  if (resultado.success) await cargarProductos()
  return resultado
}

export const updateProduct = async (idProducto, cambios) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para modificar productos.' }
  }
  const resultado = await productService.updateProduct(idProducto, cambios)
  if (resultado.success) await cargarProductos()
  return resultado
}

export const desactivarProducto = async (idProducto) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para desactivar productos.' }
  }
  const resultado = await productService.desactivarProducto(idProducto)
  if (resultado.success) await cargarProductos()
  return resultado
}

export const activarProducto = async (idProducto) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para reactivar productos.' }
  }
  const resultado = await productService.activarProducto(idProducto)
  if (resultado.success) await cargarProductos()
  return resultado
}

// --- Categorías ---
export const createCategory = async (datos) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para crear categorías.' }
  }
  const resultado = await categoryService.createCategory(datos)
  if (resultado.success) await cargarCategorias()
  return resultado
}

export const updateCategory = async (idCategoria, cambios) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para modificar categorías.' }
  }
  const resultado = await categoryService.updateCategory(idCategoria, cambios)
  if (resultado.success) await cargarCategorias()
  return resultado
}

export const desactivarCategoria = async (idCategoria) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para desactivar categorías.' }
  }
  const resultado = await categoryService.desactivarCategoria(idCategoria)
  if (resultado.success) await cargarCategorias()
  return resultado
}

export const activarCategoria = async (idCategoria) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para reactivar categorías.' }
  }
  const resultado = await categoryService.activarCategoria(idCategoria)
  if (resultado.success) await cargarCategorias()
  return resultado
}

export const eliminarCategoria = async (idCategoria) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para eliminar categorías.' }
  }
  const resultado = await categoryService.eliminarCategoria(idCategoria)
  if (resultado.success) await cargarCategorias()
  return resultado
}

// --- Movimientos ---
export const registrarMovimiento = async (datos) => {
  if (!isAdmin.value && !isOperador.value) {
    return { success: false, error: 'Necesitás una sesión activa para registrar movimientos.' }
  }

  const resultado = await movementService.registrarMovimiento(datos)
  // El stock del catálogo cambió: refrescar productos compartidos
  if (resultado.success) await cargarProductos()
  return resultado
}
