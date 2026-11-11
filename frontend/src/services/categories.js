// ============================================================================
// Stoq · Servicio de categorías (CRUD + baja lógica)
// ============================================================================
// Reglas aplicadas acá:
//  · Nombre único pre-chequeado para mensaje claro (el constraint lo garantiza).
//  · Una categoría con productos asociados no puede desactivarse ni eliminarse;
//    la base también lo impide (trigger + FK restrict) como respaldo.
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

// --- Consultar categorías ---
export const getCategories = async ({ incluirInactivas = false } = {}) => {
  let query = supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true })

  if (!incluirInactivas) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query
  return extraerDatos({ data, error })
}

// --- Contar productos por categoría (una sola consulta, agrupado en cliente) ---
export const productosPorCategoria = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('id_categoria')

  if (error) {
    return { data: null, error }
  }

  const conteo = {}
  ;(data ?? []).forEach((fila) => {
    conteo[fila.id_categoria] = (conteo[fila.id_categoria] || 0) + 1
  })

  return { data: conteo, error: null }
}

// --- Consultar todas (para administración) ---
export const getAllCategories = async () => getCategories({ incluirInactivas: true })

// --- Consultar una categoría por ID ---
export const getCategoryById = async (idCategoria) => {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('id_categoria', Number(idCategoria))
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Contar productos asociados a una categoría ---
const productosDeCategoria = async (idCategoria) => {
  const { count, error } = await supabase
    .from('productos')
    .select('id_producto', { head: true, count: 'exact' })
    .eq('id_categoria', Number(idCategoria))

  return error ? null : (count ?? 0)
}

// --- Crear categoría ---
export const createCategory = async (datos) => {
  const nombre = String(datos.nombre || '').trim()

  const { data: existente } = await supabase
    .from('categorias')
    .select('id_categoria')
    .ilike('nombre', nombre)
    .maybeSingle()

  if (existente) {
    return {
      success: false,
      error: 'Ya existe una categoría con ese nombre.',
      campo: 'nombre'
    }
  }

  const { data, error } = await supabase
    .from('categorias')
    .insert([
      {
        nombre,
        descripcion: (datos.descripcion || '').trim(),
        activo: true
      }
    ])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una categoría con ese nombre.', campo: 'nombre' }
    }
    return manejarErrorSupabase(error, 'crear categoría')
  }

  return { success: true, category: data }
}

// --- Actualizar categoría ---
export const updateCategory = async (idCategoria, cambios) => {
  const nombre = String(cambios.nombre || '').trim()

  // Nombre único excluyendo la categoría actual
  const { data: existente } = await supabase
    .from('categorias')
    .select('id_categoria')
    .ilike('nombre', nombre)
    .maybeSingle()

  if (existente && existente.id_categoria !== Number(idCategoria)) {
    return {
      success: false,
      error: 'Ya existe una categoría con ese nombre.',
      campo: 'nombre'
    }
  }

  const { data, error } = await supabase
    .from('categorias')
    .update({
      nombre,
      descripcion: (cambios.descripcion || '').trim(),
      activo: cambios.activo !== undefined ? Boolean(cambios.activo) : true
    })
    .eq('id_categoria', Number(idCategoria))
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una categoría con ese nombre.', campo: 'nombre' }
    }
    return manejarErrorSupabase(error, 'actualizar categoría')
  }

  return { success: true, category: data }
}

// --- Desactivar categoría (baja lógica; solo si no tiene productos) ---
export const desactivarCategoria = async (idCategoria) => {
  const cantidad = await productosDeCategoria(idCategoria)

  if (cantidad === null) {
    return { success: false, error: 'No se pudo verificar los productos asociados a la categoría.' }
  }

  if (cantidad > 0) {
    return {
      success: false,
      error: `No se puede desactivar la categoría porque tiene ${cantidad === 1 ? 'un producto asociado' : `${cantidad} productos asociados`}. Reasigná los productos primero.`
    }
  }

  const { data, error } = await supabase
    .from('categorias')
    .update({ activo: false })
    .eq('id_categoria', Number(idCategoria))
    .select()
    .single()

  if (error) {
    return manejarErrorSupabase(error, 'desactivar categoría')
  }

  return { success: true, category: data }
}

// --- Reactivar categoría ---
export const activarCategoria = async (idCategoria) => {
  const { data, error } = await supabase
    .from('categorias')
    .update({ activo: true })
    .eq('id_categoria', Number(idCategoria))
    .select()
    .single()

  if (error) {
    return manejarErrorSupabase(error, 'reactivar categoría')
  }

  return { success: true, category: data }
}

// --- Eliminar categoría físicamente (solo si no tiene productos asociados) ---
export const eliminarCategoria = async (idCategoria) => {
  const cantidad = await productosDeCategoria(idCategoria)

  if (cantidad === null) {
    return { success: false, error: 'No se pudo verificar los productos asociados a la categoría.' }
  }

  if (cantidad > 0) {
    return {
      success: false,
      error: `No se puede eliminar la categoría porque tiene ${cantidad === 1 ? 'un producto asociado' : `${cantidad} productos asociados`}. Desactivala o reasigná los productos primero.`
    }
  }

  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id_categoria', Number(idCategoria))

  if (error) {
    return manejarErrorSupabase(error, 'eliminar categoría')
  }

  return { success: true }
}
