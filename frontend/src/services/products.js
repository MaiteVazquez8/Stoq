// ============================================================================
// Stoq · Servicio de productos (CRUD + baja lógica)
// ============================================================================
// Reglas aplicadas acá:
//  · El stock NO se modifica por edición (RN07): solo vía RPC registrar_movimiento.
//  · SKU único validado en servidor (constraint) y pre-chequeado para dar un
//    mensaje claro al usuario.
//  · Los productos con historial no se eliminan: baja lógica vía RPC.
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

const esDuplicado = (error) => error?.code === '23505' && String(error?.message || '').includes('productos_codigo_key')

// --- Consultar productos (vista con categoría y estado de stock) ---
export const getProducts = async ({ incluirInactivos = true } = {}) => {
  let query = supabase
    .from('vw_productos_resumen')
    .select('*')
    .order('nombre', { ascending: true })

  if (!incluirInactivos) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query
  return extraerDatos({ data, error })
}

// --- Consultar productos activos ---
export const getProductsActivos = async () => getProducts({ incluirInactivos: false })

// --- Consultar un producto por ID ---
export const getProductById = async (idProducto) => {
  const { data, error } = await supabase
    .from('vw_productos_resumen')
    .select('*')
    .eq('id_producto', Number(idProducto))
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Consultar un producto por código (SKU) ---
export const getProductByCode = async (codigo) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .ilike('codigo', String(codigo || '').trim())
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Crear producto ---
export const createProduct = async (datos) => {
  // Pre-chequeo de SKU único para un mensaje claro (el constraint lo garantiza)
  const { data: existente } = await getProductByCode(datos.codigo)
  if (existente) {
    return {
      success: false,
      error: 'Este SKU ya existe. Usá un código único.',
      campo: 'codigo'
    }
  }

  const { data, error } = await supabase
    .from('productos')
    .insert([
      {
        codigo: datos.codigo.trim().toUpperCase(),
        nombre: datos.nombre.trim(),
        descripcion: (datos.descripcion || '').trim(),
        id_categoria: Number(datos.id_categoria),
        unidad_medida: datos.unidad_medida,
        precio: Number(datos.precio),
        stock_actual: Number(datos.cantidad_inicial || 0),
        stock_minimo: Number(datos.stock_minimo),
        fecha_creacion: new Date().toISOString().slice(0, 10),
        activo: true
      }
    ])
    .select('*')
    .single()

  if (error) {
    if (esDuplicado(error)) {
      return { success: false, error: 'Este SKU ya existe. Usá un código único.', campo: 'codigo' }
    }
    return manejarErrorSupabase(error, 'crear producto')
  }

  return { success: true, product: data }
}

// --- Actualizar producto (sin tocar stock_actual, RN07) ---
export const updateProduct = async (idProducto, cambios) => {
  const { data: existente } = await getProductByCode(cambios.codigo)
  if (existente && existente.id_producto !== Number(idProducto)) {
    return {
      success: false,
      error: 'Este SKU ya existe. Usá un código único.',
      campo: 'codigo'
    }
  }

  const { data, error } = await supabase
    .from('productos')
    .update({
      codigo: cambios.codigo.trim().toUpperCase(),
      nombre: cambios.nombre.trim(),
      descripcion: (cambios.descripcion || '').trim(),
      id_categoria: Number(cambios.id_categoria),
      unidad_medida: cambios.unidad_medida,
      precio: Number(cambios.precio),
      stock_minimo: Number(cambios.stock_minimo)
    })
    .eq('id_producto', Number(idProducto))
    .select('*')
    .single()

  if (error) {
    if (esDuplicado(error)) {
      return { success: false, error: 'Este SKU ya existe. Usá un código único.', campo: 'codigo' }
    }
    return manejarErrorSupabase(error, 'actualizar producto')
  }

  return { success: true, product: data }
}

// --- Baja lógica de producto (RPC; solo administrador) ---
export const desactivarProducto = async (idProducto) => {
  const { data, error } = await supabase
    .rpc('desactivar_producto', { p_id_producto: Number(idProducto) })

  if (error) {
    return manejarErrorSupabase(error, 'desactivar producto')
  }

  return data || { success: false, error: 'No se pudo desactivar el producto.' }
}

// --- Reactivar producto (RPC; solo administrador) ---
export const activarProducto = async (idProducto) => {
  const { data, error } = await supabase
    .rpc('activar_producto', { p_id_producto: Number(idProducto) })

  if (error) {
    return manejarErrorSupabase(error, 'reactivar producto')
  }

  return data || { success: false, error: 'No se pudo reactivar el producto.' }
}

// --- Contar productos activos ---
export const contarProductos = async () => {
  const { count, error } = await supabase
    .from('productos')
    .select('*', { head: true, count: 'exact' })
    .eq('activo', true)

  if (error) {
    return { count: 0, error }
  }

  return { count: count ?? 0, error: null }
}
