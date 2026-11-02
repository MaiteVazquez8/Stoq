import { ref, computed, reactive } from 'vue'
import { roles, ROLES } from '@/data/roles'
import { users, getUserByEmail, getUserRole } from '@/data/users'
import { categories, getCategoryName } from '@/data/categories'
import { products, getProductById, getProductByCode, isStockLow } from '@/data/products'
import { movements, addMovement, getMovementsByProduct, getMovementTypeLabel } from '@/data/movements'

// --- Estado simulado de sesión ---
const currentUser = ref(null)
export const isAuthenticated = ref(false)

// --- Estado del tema ---
const isDarkMode = ref(false)

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
}

const getTheme = () => isDarkMode.value

// --- Datos reactivos ---
const localProducts = ref([...products])
const localMovements = ref([...movements])
const localCategories = ref([...categories])

// --- Auth simulada ---
export const login = (email, password) => {
  const user = getUserByEmail(email)
  if (user) {
    currentUser.value = user
    isAuthenticated.value = true
    return { success: true, user }
  }
  return { success: false, error: 'Correo o contraseña incorrectos.' }
}

export const logout = () => {
  currentUser.value = null
  isAuthenticated.value = false
}

export const getCurrentUser = () => currentUser.value
export const getIsAuthenticated = () => isAuthenticated.value
export const isAdmin = () => currentUser.value && currentUser.value.id_rol === ROLES.ADMIN
export const isOperador = () => currentUser.value && currentUser.value.id_rol === ROLES.OPERADOR

// --- Productos ---
export const getProducts = () => localProducts.value
export const getProduct = (id) => getProductById(id)
export const searchProducts = (query) => {
  const q = query.toLowerCase()
  return localProducts.value.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.codigo.toLowerCase().includes(q)
  )
}
export const filterProductsByCategory = (categoryId) => {
  if (!categoryId || categoryId === 'todos') return localProducts.value
  return localProducts.value.filter(p => p.id_categoria === Number(categoryId))
}
export const getLowStockProducts = () => {
  return localProducts.value.filter(p => isStockLow(p))
}

// Crear producto (solo admin)
export const createProduct = (productData) => {
  // Validar código único
  if (getProductByCode(productData.codigo)) {
    return { success: false, error: 'El código del producto ya existe.' }
  }
  const newId = Math.max(...localProducts.value.map(p => p.id_producto), 0) + 1
  const newProduct = {
    id_producto: newId,
    codigo: productData.codigo,
    nombre: productData.nombre,
    descripcion: productData.descripcion || '',
    id_categoria: productData.id_categoria,
    precio: Number(productData.precio),
    stock_actual: Number(productData.cantidad_inicial),
    stock_minimo: Number(productData.stock_minimo) || 0,
    fecha_creacion: new Date().toISOString().split('T')[0]
  }
  localProducts.value.push(newProduct)
  return { success: true, product: newProduct }
}

// Editar producto (solo admin)
export const updateProduct = (id, updates) => {
  const index = localProducts.value.findIndex(p => p.id_producto === id)
  if (index === -1) {
    return { success: false, error: 'Producto no encontrado.' }
  }
  // No permitir cambiar stock aquí (se hace por movimientos)
  const { stock_actual, ...rest } = updates
  localProducts.value[index] = { ...localProducts.value[index], ...rest }
  return { success: true, product: localProducts.value[index] }
}

// --- Movimientos ---
export const getMovements = () => localMovements.value
export const getMovementsForProduct = (idProducto) => getMovementsByProduct(idProducto)

// Registrar movimiento
export const registerMovement = (movementData, currentUser) => {
  const producto = getProductById(movementData.id_producto)
  if (!producto) {
    return { success: false, error: 'Producto no encontrado.' }
  }

  const cantidad = Number(movementData.cantidad)
  if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
    return { success: false, error: 'La cantidad debe ser un número entero positivo.' }
  }

  let nuevoStock
  if (movementData.tipo_movimiento === 'Entrada') {
    nuevoStock = producto.stock_actual + cantidad
  } else if (movementData.tipo_movimiento === 'Salida') {
    if (cantidad > producto.stock_actual) {
      return {
        success: false,
        error: `Stock insuficiente. Disponible: ${producto.stock_actual} unidad(es).`
      }
    }
    nuevoStock = producto.stock_actual - cantidad
  } else {
    return { success: false, error: 'Tipo de movimiento inválido.' }
  }

  const newId = Math.max(...localMovements.value.map(m => m.id_movimiento), 0) + 1
  const now = new Date()
  const fechaHora = now.toISOString().slice(0, 19).replace('T', ' ')

  const movement = {
    id_movimiento: newId,
    id_producto: movementData.id_producto,
    id_usuario: currentUser.id_usuario,
    tipo_movimiento: movementData.tipo_movimiento,
    cantidad,
    fecha_hora: fechaHora,
    observacion: movementData.observacion || ''
  }

  // Actualizar stock y agregar movimiento como una operación atómica
  const productIndex = localProducts.value.findIndex(p => p.id_producto === movementData.id_producto)
  localProducts.value[productIndex].stock_actual = nuevoStock
  localMovements.value.push(movement)

  return { success: true, movement, nuevoStock }
}

// --- Utilidades ---
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value)
}

export { roles, ROLES, categories, getCategoryName, getMovementTypeLabel, isStockLow, toggleTheme, getTheme }
