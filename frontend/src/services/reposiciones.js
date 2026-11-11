// ============================================================================
// Stoq · Servicio de reposiciones (RF13, solo administrador)
// ============================================================================
// Una reposición representa un pedido esperado de mercadería vinculado
// opcionalmente a un proveedor. Gestiona el estado (pendiente/recibida) y el
// detalle de productos esperados (reposicion_productos).
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

// --- Consultar reposiciones (vista con proveedor y totales) ---
export const getReposiciones = async () => {
  const { data, error } = await supabase
    .from('vw_reposiciones_detalle')
    .select('*')
    .order('fecha', { ascending: false })

  return extraerDatos({ data, error })
}

// --- Consultar una reposición con su detalle de productos ---
export const getReposicionConDetalle = async (idReposicion) => {
  const { data, error } = await supabase
    .from('reposiciones')
    .select(`
      id_reposicion, fecha, estado, observacion, created_at, id_proveedor,
      proveedores(nombre_razon_social, telefono, email, direccion, observaciones),
      reposicion_productos(cantidad, productos(id_producto, codigo, nombre, stock_actual))
    `)
    .eq('id_reposicion', Number(idReposicion))
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Crear reposición ---
export const createReposicion = async (datos) => {
  const fechaISO = datos.fecha || new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('reposiciones')
    .insert([{
      id_proveedor: datos.id_proveedor ? Number(datos.id_proveedor) : null,
      fecha: fechaISO,
      estado: 'pendiente',
      observacion: (datos.observacion || '').trim() || null
    }])
    .select('*')
    .single()

  if (error) {
    return manejarErrorSupabase(error, 'crear reposición')
  }

  return { success: true, reposicion: data }
}

// --- Actualizar reposicion (solo pendiente) ---
export const updateReposicion = async (idReposicion, cambios) => {
  const { data: actual, error: errorActual } = await supabase
    .from('reposiciones')
    .select('estado')
    .eq('id_reposicion', Number(idReposicion))
    .maybeSingle()

  if (errorActual) {
    return manejarErrorSupabase(errorActual, 'consultar reposición')
  }

  if (!actual) {
    return { success: false, error: 'La reposición no existe.' }
  }

  if (actual.estado === 'recibida') {
    return { success: false, error: 'La reposición ya fue recibida y no se puede modificar.' }
  }

  const { data, error } = await supabase
    .from('reposiciones')
    .update({
      id_proveedor: cambios.id_proveedor ? Number(cambios.id_proveedor) : null,
      fecha: cambios.fecha,
      observacion: (cambios.observacion || '').trim() || null
    })
    .eq('id_reposicion', Number(idReposicion))
    .eq('estado', 'pendiente')
    .select('*')
    .single()

  if (error) {
    return manejarErrorSupabase(error, 'actualizar reposición')
  }

  return { success: true, reposicion: data }
}

// --- Eliminar reposición (solo si está pendiente) ---
export const eliminarReposicion = async (idReposicion) => {
  const { data: actual, error: errorActual } = await supabase
    .from('reposiciones')
    .select('estado')
    .eq('id_reposicion', Number(idReposicion))
    .maybeSingle()

  if (errorActual) {
    return manejarErrorSupabase(errorActual, 'consultar reposición')
  }

  if (!actual) {
    return { success: false, error: 'La reposición no existe.' }
  }

  if (actual.estado === 'recibida') {
    return { success: false, error: 'La reposición recibida no se puede eliminar: conserva la trazabilidad del pedido.' }
  }

  const { error } = await supabase
    .from('reposiciones')
    .delete()
    .eq('id_reposicion', Number(idReposicion))
    .eq('estado', 'pendiente')

  if (error) {
    return manejarErrorSupabase(error, 'eliminar reposición')
  }

  return { success: true }
}

// --- Marcar como recibida ---
export const marcarRecibida = async (idReposicion) => {
  const { data, error } = await supabase
    .from('reposiciones')
    .update({ estado: 'recibida' })
    .eq('id_reposicion', Number(idReposicion))
    .eq('estado', 'pendiente')
    .select('*')
    .single()

  if (error) {
    return manejarErrorSupabase(error, 'marcar reposición como recibida')
  }

  if (!data) {
    return { success: false, error: 'La reposición ya está recibida o no existe.' }
  }

  return { success: true, reposicion: data }
}

// --- Agregar/actualizar línea (producto + cantidad); solo si pendiente ---
export const agregarLinea = async (idReposicion, idProducto, cantidad) => {
  const { data: actual } = await supabase
    .from('reposiciones')
    .select('estado')
    .eq('id_reposicion', Number(idReposicion))
    .maybeSingle()

  if (actual?.estado === 'recibida') {
    return { success: false, error: 'La reposición ya fue recibida; no se pueden modificar las líneas.' }
  }

  const cant = Number(cantidad)
  if (!Number.isFinite(cant) || cant <= 0 || !Number.isInteger(cant)) {
    return { success: false, error: 'La cantidad debe ser un entero mayor a 0.' }
  }

  const { error } = await supabase
    .from('reposicion_productos')
    .upsert({ id_reposicion: Number(idReposicion), id_producto: Number(idProducto), cantidad: cant })

  if (error) {
    return manejarErrorSupabase(error, 'agregar línea de reposición')
  }

  return { success: true }
}

// --- Quitado de una línea ---
export const quitarLinea = async (idReposicion, idProducto) => {
  const { data: actual } = await supabase
    .from('reposiciones')
    .select('estado')
    .eq('id_reposicion', Number(idReposicion))
    .maybeSingle()

  if (actual?.estado === 'recibida') {
    return { success: false, error: 'La reposición ya fue recibida; no se pueden modificar las líneas.' }
  }

  const { error } = await supabase
    .from('reposicion_productos')
    .delete()
    .eq('id_reposicion', Number(idReposicion))
    .eq('id_producto', Number(idProducto))

  if (error) {
    return manejarErrorSupabase(error, 'quitar línea de reposición')
  }

  return { success: true }
}
