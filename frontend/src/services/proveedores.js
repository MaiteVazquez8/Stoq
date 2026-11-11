// ============================================================================
// Stoq · Servicio de proveedores (CRUD, solo administrador)
// ============================================================================
// La RLS de proveedores restringe todo al rol Administrador; el operador no
// tiene acceso. Las operaciones de aquí se ejecutan como el usuario logueado.
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

// --- Consultar todos los proveedores (admin) ---
export const getProveedores = async () => {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre_razon_social', { ascending: true })

  return extraerDatos({ data, error })
}

// --- Consultar un proveedor por ID ---
export const getProveedorById = async (idProveedor) => {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('id_proveedor', Number(idProveedor))
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Nombre a mostrar (usar en listados; evita duplicar la consulta) ---
export const getProveedorNombre = async (idProveedor) => {
  if (!idProveedor) return '-'
  const { data, error } = await supabase
    .from('proveedores')
    .select('nombre_razon_social')
    .eq('id_proveedor', Number(idProveedor))
    .maybeSingle()

  if (error || !data) return '-'
  return data.nombre_razon_social
}

// --- Crear proveedor ---
export const createProveedor = async (datos) => {
  const nombre = (datos.nombre_razon_social || '').trim()

  // Pre-chequeo de nombre único (el constraint queda como respaldo)
  const { data: existente } = await supabase
    .from('proveedores')
    .select('id_proveedor')
    .ilike('nombre_razon_social', nombre)
    .maybeSingle()

  if (existente) {
    return {
      success: false,
      error: 'Ya existe un proveedor con ese nombre o razón social.',
      campo: 'nombre_razon_social'
    }
  }

  const { data, error } = await supabase
    .from('proveedores')
    .insert([{
      nombre_razon_social: nombre,
      telefono: (datos.telefono || '').trim(),
      email: (datos.email || '').trim() || null,
      direccion: (datos.direccion || '').trim(),
      observaciones: (datos.observaciones || '').trim()
    }])
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un proveedor con ese nombre o razón social.', campo: 'nombre_razon_social' }
    }
    return manejarErrorSupabase(error, 'crear proveedor')
  }

  return { success: true, proveedor: data }
}

// --- Actualizar proveedor ---
export const updateProveedor = async (idProveedor, cambios) => {
  const nombre = (cambios.nombre_razon_social || '').trim()

  const { data: existente } = await supabase
    .from('proveedores')
    .select('id_proveedor')
    .ilike('nombre_razon_social', nombre)
    .maybeSingle()

  if (existente && existente.id_proveedor !== Number(idProveedor)) {
    return {
      success: false,
      error: 'Ya existe un proveedor con ese nombre o razón social.',
      campo: 'nombre_razon_social'
    }
  }

  const { data, error } = await supabase
    .from('proveedores')
    .update({
      nombre_razon_social: nombre,
      telefono: (cambios.telefono || '').trim(),
      email: (cambios.email || '').trim() || null,
      direccion: (cambios.direccion || '').trim(),
      observaciones: (cambios.observaciones || '').trim()
    })
    .eq('id_proveedor', Number(idProveedor))
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un proveedor con ese nombre o razón social.', campo: 'nombre_razon_social' }
    }
    return manejarErrorSupabase(error, 'actualizar proveedor')
  }

  return { success: true, proveedor: data }
}

// --- Eliminar proveedor (RPC fail-safe; solo si no tiene reposiciones) ---
export const eliminarProveedor = async (idProveedor) => {
  const { data, error } = await supabase
    .rpc('eliminar_proveedor', { p_id_proveedor: Number(idProveedor) })

  if (error) {
    return manejarErrorSupabase(error, 'eliminar proveedor')
  }

  return data || { success: false, error: 'No se pudo eliminar el proveedor.' }
}
