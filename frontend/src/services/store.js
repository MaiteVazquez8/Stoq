// Estado reactivo simulado de Stoq.
// Desacopla las vistas de los datos: las vistas consumen estas funciones y,
// cuando Supabase esté disponible, sólo se reemplaza la implementación.

import { ref, computed } from 'vue'
import { ROLES } from '@/data/roles'
import { getUserByEmail, users } from '@/data/users'
import { categories } from '@/data/categories'
import { products } from '@/data/products'
import { movements } from '@/data/movements'
import { negocio } from '@/data/business'
import { getMotivoOptions } from '@/data/movementMotives'

// --- Sesión simulada (RN01) ---
const currentUser = ref(null)

export const isAuthenticated = computed(() => currentUser.value !== null)
export const isAdmin = computed(() => currentUser.value?.id_rol === ROLES.ADMIN)
export const isOperador = computed(() => currentUser.value?.id_rol === ROLES.OPERADOR)

export const getCurrentUser = () => currentUser.value
export const getUserRoleName = () => {
  if (!currentUser.value) return ''
  return currentUser.value.id_rol === ROLES.ADMIN ? 'Administrador' : 'Operador'
}

export const login = (email, password) => {
  const usuario = getUserByEmail(email)

  if (!usuario) {
    return {
      success: false,
      error: `No encontramos una cuenta con ese correo. Probá con ${users
        .map(u => u.email)
        .join(' o ')}.`
    }
  }

  if (String(password || '').trim().length < 4) {
    return { success: false, error: 'Ingresá tu contraseña (mínimo 4 caracteres).' }
  }

  if (usuario.estado !== 'activo') {
    return { success: false, error: 'La cuenta está inactiva. Contactá al administrador.' }
  }

  currentUser.value = usuario
  return { success: true, user: usuario }
}

export const logout = () => {
  currentUser.value = null
}

// --- Tema ---
const isDarkMode = ref(false)
export const getTheme = () => isDarkMode.value
export const isDarkTheme = computed(() => isDarkMode.value)

export const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark', isDarkMode.value)
  }
  return isDarkMode.value
}

// --- Datos reactivos (copia de trabajo, nunca se mutan los archivos de datos) ---
const productsState = ref(products.map(p => ({ ...p })))
const movementsState = ref(movements.map(m => ({ ...m })))
const categoriesState = ref(categories.map(c => ({ ...c })))

export const getProducts = () => productsState.value
export const getMovements = () => movementsState.value
export const getCategories = () => categoriesState.value

export const findProduct = (idProducto) =>
  productsState.value.find(p => p.id_producto === Number(idProducto))

export const findProductByCode = (codigo, exceptoId = null) => {
  const normalizado = String(codigo || '').trim().toLowerCase()
  return productsState.value.find(
    p => p.codigo.toLowerCase() === normalizado && p.id_producto !== Number(exceptoId)
  )
}

export const getMovementMotives = (tipo) => getMotivoOptions(tipo)

// --- Productos (RN02, RN03, RN09) ---
export const createProduct = (datos) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para registrar productos.' }
  }

  if (findProductByCode(datos.codigo)) {
    return { success: false, error: 'Este SKU ya existe. Usá un código único.', campo: 'codigo' }
  }

  const nuevoId = productsState.value.reduce((max, p) => Math.max(max, p.id_producto), 0) + 1

  const producto = {
    id_producto: nuevoId,
    codigo: String(datos.codigo).trim().toUpperCase(),
    nombre: String(datos.nombre).trim(),
    descripcion: String(datos.descripcion || '').trim(),
    id_categoria: Number(datos.id_categoria),
    unidad_medida: datos.unidad_medida,
    precio: Number(datos.precio),
    stock_actual: Number(datos.cantidad_inicial),
    stock_minimo: Number(datos.stock_minimo),
    fecha_creacion: negocio.hoy.slice(0, 10)
  }

  productsState.value = [...productsState.value, producto]
  return { success: true, product: producto }
}

export const updateProduct = (idProducto, cambios) => {
  if (!isAdmin.value) {
    return { success: false, error: 'Tu perfil no tiene permiso para modificar productos.' }
  }

  const indice = productsState.value.findIndex(p => p.id_producto === Number(idProducto))
  if (indice === -1) {
    return { success: false, error: 'El producto no existe.' }
  }

  if (findProductByCode(cambios.codigo, idProducto)) {
    return { success: false, error: 'Este SKU ya existe. Usá un código único.', campo: 'codigo' }
  }

  const actual = productsState.value[indice]
  const actualizado = {
    ...actual,
    codigo: String(cambios.codigo).trim().toUpperCase(),
    nombre: String(cambios.nombre).trim(),
    descripcion: String(cambios.descripcion || '').trim(),
    id_categoria: Number(cambios.id_categoria),
    unidad_medida: cambios.unidad_medida,
    precio: Number(cambios.precio),
    stock_minimo: Number(cambios.stock_minimo)
    // stock_actual no se modifica por edición: cambia con entradas y salidas (RN07).
  }

  const copia = [...productsState.value]
  copia[indice] = actualizado
  productsState.value = copia

  return { success: true, product: actualizado }
}

// --- Movimientos de stock (RN04, RN05, RN06, RN07, RN08, RN10) ---
const minutosRelojDemo = ref(0)

const siguienteFechaHora = () => {
  const base = new Date(`${negocio.hoy.replace(' ', 'T')}:00`)
  base.setMinutes(base.getMinutes() + minutosRelojDemo.value)
  minutosRelojDemo.value += 1

  const dia = String(base.getDate()).padStart(2, '0')
  const mes = String(base.getMonth() + 1).padStart(2, '0')
  const hora = String(base.getHours()).padStart(2, '0')
  const minuto = String(base.getMinutes()).padStart(2, '0')
  return `${base.getFullYear()}-${mes}-${dia} ${hora}:${minuto}`
}

export const registrarMovimiento = (datos) => {
  if (!isAdmin.value && !isOperador.value) {
    return { success: false, error: 'Necesitás una sesión activa para registrar movimientos.' }
  }

  const producto = findProduct(datos.id_producto)
  if (!producto) {
    return { success: false, error: 'El producto seleccionado no existe.', campo: 'id_producto' }
  }

  const cantidad = Number(datos.cantidad)
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { success: false, error: 'Ingresá una cantidad entera mayor a 0.', campo: 'cantidad' }
  }

  const tipo = datos.tipo_movimiento
  if (tipo !== 'Entrada' && tipo !== 'Salida') {
    return { success: false, error: 'Elegí si el movimiento es una entrada o una salida.', campo: 'tipo_movimiento' }
  }

  if (tipo === 'Salida' && cantidad > producto.stock_actual) {
    return {
      success: false,
      error: `La cantidad supera el stock disponible. Tenés ${producto.stock_actual} unidades. Ingresá una cantidad entre 1 y ${producto.stock_actual} para registrar la salida.`,
      campo: 'cantidad'
    }
  }

  if (!datos.motivo) {
    return { success: false, error: 'Elegí el motivo del movimiento.', campo: 'motivo' }
  }

  const stockAnterior = producto.stock_actual
  const stockNuevo = tipo === 'Entrada' ? stockAnterior + cantidad : stockAnterior - cantidad

  const movimiento = {
    id_movimiento: movementsState.value.reduce((max, m) => Math.max(max, m.id_movimiento), 0) + 1,
    id_producto: producto.id_producto,
    id_usuario: currentUser.value.id_usuario,
    tipo_movimiento: tipo,
    cantidad,
    fecha_hora: siguienteFechaHora(),
    motivo: datos.motivo,
    observacion: String(datos.observacion || '').trim()
  }

  // RN08: el stock y el movimiento se actualizan como una única operación lógica.
  const productosActualizados = productsState.value.map(p =>
    p.id_producto === producto.id_producto ? { ...p, stock_actual: stockNuevo } : p
  )

  productsState.value = productosActualizados
  movementsState.value = [...movementsState.value, movimiento]

  return { success: true, movement: movimiento, stockAnterior, stockNuevo }
}
