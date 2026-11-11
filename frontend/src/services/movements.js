// ============================================================================
// Stoq · Servicio de movimientos de stock
// ============================================================================
// Reglas aplicadas acá:
//  · El registro es atómico vía RPC registrar_movimiento (stock + historial
//    en una única transacción). El usuario responsable es siempre el
//    autenticado: no se acepta id_usuario como parámetro desde el cliente.
//  · El historial es de solo lectura: no se ofrecen operaciones de
//    modificación ni borrado de movimientos (RN10).
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

// --- Consultar movimientos (vista con producto, usuario y saldo) ---
export const getMovements = async ({ limite } = {}) => {
  let query = supabase
    .from('vw_movimientos_detalle')
    .select('*')
    .order('fecha_hora', { ascending: false })

  if (limite) {
    query = query.limit(limite)
  }

  const { data, error } = await query
  return extraerDatos({ data, error })
}

// --- Consultar un movimiento por ID ---
export const getMovementById = async (idMovimiento) => {
  const { data, error } = await supabase
    .from('vw_movimientos_detalle')
    .select('*')
    .eq('id_movimiento', Number(idMovimiento))
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Consultar movimientos de un producto (más recientes primero) ---
export const getMovementsByProduct = async (idProducto, limite = null) => {
  let query = supabase
    .from('vw_movimientos_detalle')
    .select('*')
    .eq('id_producto', Number(idProducto))
    .order('fecha_hora', { ascending: false })

  if (limite) {
    query = query.limit(limite)
  }

  const { data, error } = await query
  return extraerDatos({ data, error })
}

// --- Registrar movimiento de forma atómica (RPC, solo sesión activa) ---
export const registrarMovimiento = async (datos) => {
  const { data, error } = await supabase
    .rpc('registrar_movimiento', {
      p_id_producto: Number(datos.id_producto),
      p_tipo_movimiento: datos.tipo_movimiento,
      p_cantidad: Number(datos.cantidad),
      p_motivo: String(datos.motivo || '').trim(),
      p_observacion: datos.observacion ? String(datos.observacion).trim() : null
    })

  if (error) {
    return manejarErrorSupabase(error, 'registrar movimiento')
  }

  return data || { success: false, error: 'No se pudo registrar el movimiento.' }
}

// --- Filtrar historial (búsqueda, tipo, fechas, producto, responsable, orden) ---
export const filtrarHistorial = async (filtros = {}) => {
  let query = supabase
    .from('vw_movimientos_detalle')
    .select('*')

  // Búsqueda por texto (producto, SKU, motivo, observación, responsable)
  if (filtros.busqueda && filtros.busqueda.trim()) {
    const texto = filtros.busqueda.trim().replace(/[%,()]/g, '')
    if (texto) {
      query = query.or(
        `producto_nombre.ilike.%${texto}%,producto_codigo.ilike.%${texto}%,motivo.ilike.%${texto}%,observacion.ilike.%${texto}%,usuario_nombre.ilike.%${texto}%`
      )
    }
  }

  // Filtro por tipo
  if (filtros.tipo && filtros.tipo !== 'todos') {
    query = query.eq('tipo_movimiento', filtros.tipo)
  }

  // Filtro por fechas (desde/hasta como 'YYYY-MM-DD', en hora local del navegador)
  if (filtros.desde) {
    query = query.gte('fecha_hora', new Date(`${filtros.desde}T00:00:00`).toISOString())
  }
  if (filtros.hasta) {
    query = query.lte('fecha_hora', new Date(`${filtros.hasta}T23:59:59.999`).toISOString())
  }

  // Filtro por producto
  if (filtros.idProducto) {
    query = query.eq('id_producto', Number(filtros.idProducto))
  }

  // Filtro por responsable
  if (filtros.idResponsable && filtros.idResponsable !== 'todos') {
    query = query.eq('id_usuario', filtros.idResponsable)
  }

  // Ordenamiento por fecha
  const descendente = filtros.orden !== 'asc'
  query = query.order('fecha_hora', { ascending: !descendente }).order('id_movimiento', { ascending: !descendente })

  // Tope de seguridad para evitar consultas sin límite
  if (filtros.limite) {
    query = query.limit(filtros.limite)
  }

  const { data, error } = await query
  return extraerDatos({ data, error })
}

// --- Usuarios responsables registrados (para el filtro del historial) ---
export const getResponsables = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  return extraerDatos({ data, error })
}

// --- Totales de un conjunto de movimientos (función pura) ---
export const calcularTotales = (movimientos) => {
  const entradas = movimientos
    .filter((m) => m.tipo_movimiento === 'Entrada')
    .reduce((total, m) => total + Number(m.cantidad), 0)
  const salidas = movimientos
    .filter((m) => m.tipo_movimiento === 'Salida')
    .reduce((total, m) => total + Number(m.cantidad), 0)

  return {
    entradas,
    salidas,
    neto: entradas - salidas
  }
}
