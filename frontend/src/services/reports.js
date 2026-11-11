// ============================================================================
// Stoq · Servicio de informes (RF12)
// ============================================================================
// Informes de inventario y movimientos para un período determinado.
// Agrega con los datos ya disponibles (productos, movimientos, categorías);
// no duplica información: todo se obtiene con consultas a Supabase.
// ============================================================================

import * as movementService from '@/services/movements'
import * as productService from '@/services/products'

// --- Resumen de movimientos para un período [desde, hasta] (fechas locales) ---
export const resumenMovimientos = async ({ desde, hasta }) => {
  const { data, error } = await movementService.filtrarHistorial({
    desde,
    hasta,
    orden: 'asc',
    limite: 5000
  })

  if (error) {
    return { data: null, error }
  }

  const movimientos = data ?? []

  const porProducto = new Map()
  const porDia = new Map()

  for (const m of movimientos) {
    const cant = Number(m.cantidad)

    // Por producto
    const clave = m.id_producto
    const prod = porProducto.get(clave) || {
      id_producto: clave,
      codigo: m.producto_codigo,
      nombre: m.producto_nombre,
      entradas: 0,
      salidas: 0
    }
    if (m.tipo_movimiento === 'Entrada') prod.entradas += cant
    else prod.salidas += cant
    porProducto.set(clave, prod)

    // Por día
    const dia = String(m.fecha_hora).slice(0, 10)
    const d = porDia.get(dia) || { dia, entradas: 0, salidas: 0 }
    if (m.tipo_movimiento === 'Entrada') d.entradas += cant
    else d.salidas += cant
    porDia.set(dia, d)
  }

  // Enriquecer con stock y categoría actuales (1 consulta)
  const { data: productosData } = await productService.getProducts() // todos, para mostrar stock de inactivos
  const productosPorId = new Map((productosData ?? []).map((p) => [p.id_producto, p]))

  const porCategoria = new Map()
  const listaProductos = [...porProducto.values()].map((p) => {
    const match = productosPorId.get(p.id_producto) || null
    const entradas = p.entradas
    const salidas = p.salidas
    const idCategoria = match?.id_categoria ?? null
    const categoriaNombre = match?.categoria_nombre ?? 'Sin categoría'
    return {
      ...p,
      stock_actual: match?.stock_actual ?? 0,
      unidad_medida: match?.unidad_medida ?? '',
      id_categoria: idCategoria,
      categoria_nombre: categoriaNombre,
      neto: entradas - salidas
    }
  }).sort((a, b) => b.neto - a.neto)

  for (const p of listaProductos) {
    if (p.id_categoria == null) continue
    const agg = porCategoria.get(p.id_categoria) || {
      id_categoria: p.id_categoria,
      nombre: p.categoria_nombre,
      entradas: 0,
      salidas: 0
    }
    agg.entradas += p.entradas
    agg.salidas += p.salidas
    porCategoria.set(p.id_categoria, agg)
  }

  const listaCategorias = [...porCategoria.values()]
    .map((c) => ({ ...c, neto: c.entradas - c.salidas }))
    .sort((a, b) => b.neto - a.neto)

  const listaDias = [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia))

  const entradas = movimientos.filter((m) => m.tipo_movimiento === 'Entrada').reduce((t, m) => t + Number(m.cantidad), 0)
  const salidas = movimientos.filter((m) => m.tipo_movimiento === 'Salida').reduce((t, m) => t + Number(m.cantidad), 0)

  return {
    data: {
      desde,
      hasta,
      movimientos: movimientos.length,
      entradas,
      salidas,
      neto: entradas - salidas,
      porProducto: listaProductos,
      porCategoria: listaCategorias,
      porDia: listaDias
    },
    error: null
  }
}

// --- Resumen de inventario (existencias actuales) ---
export const resumenInventario = async () => {
  const { data: productos, error } = await productService.getProductsActivos()

  if (error) {
    return { data: null, error }
  }

  const lista = productos ?? []
  const unidades = lista.reduce((t, p) => t + Number(p.stock_actual || 0), 0)
  const valor = lista.reduce((t, p) => t + Number(p.precio || 0) * Number(p.stock_actual || 0), 0)

  const porCategoria = new Map()
  for (const p of lista) {
    const clave = p.categoria_nombre || 'Sin categoría'
    const agg = porCategoria.get(clave) || { nombre: clave, productos: 0, unidades: 0, valor: 0 }
    agg.productos += 1
    agg.unidades += Number(p.stock_actual || 0)
    agg.valor += Number(p.precio || 0) * Number(p.stock_actual || 0)
    porCategoria.set(clave, agg)
  }

  const listaCategorias = [...porCategoria.values()].sort((a, b) => b.valor - a.valor)

  const stockBajo = lista.filter((p) => Number(p.stock_actual || 0) > 0 && Number(p.stock_actual || 0) < Number(p.stock_minimo || 0)).length
  const agotados = lista.filter((p) => Number(p.stock_actual || 0) <= 0).length

  return {
    data: {
      totalProductos: lista.length,
      unidades,
      valorInventario: Math.round(valor * 100) / 100,
      stockBajo,
      agotados,
      porCategoria: listaCategorias
    },
    error: null
  }
}
