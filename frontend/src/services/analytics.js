// ============================================================================
// Stoq · Cálculos derivados del inventario (Supabase)
// ============================================================================
// Funciones async de consulta y cálculo. El período de análisis es dinámico
// (últimos 7 días corridos hasta hoy); ya no depende de fechas fijas de demo.
// La vista vw_movimientos_detalle ya entrega saldo_resultante y datos
// relacionados, por lo que no se hacen joins desde el cliente.
// ============================================================================

import * as productService from '@/services/products'
import * as movementService from '@/services/movements'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Instante de un movimiento (timestamptz devuelto por PostgREST)
const instanteDe = (fechaHora) => new Date(String(fechaHora).replace(' ', 'T'))

const inicioDeDia = (d) => {
  const f = new Date(d)
  f.setHours(0, 0, 0, 0)
  return f
}

const finDeDia = (d) => {
  const f = new Date(d)
  f.setHours(23, 59, 59, 999)
  return f
}

const enRangoFechas = (fechaHora, desdeDia, hastaDia) => {
  const t = instanteDe(fechaHora).getTime()
  return t >= inicioDeDia(desdeDia).getTime() && t <= finDeDia(hastaDia).getTime()
}

// --- Estado de stock (RN11): se señala cuando el stock es MENOR al mínimo ---
export const estadoStock = (producto) => {
  if (!producto) return 'suficiente'
  if (producto.stock_actual <= 0) return 'agotado'
  if (producto.stock_actual < producto.stock_minimo) return 'bajo'
  return 'suficiente'
}



const aISO = (fecha) => {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// --- Rango de los últimos 7 días corridos (dinámico) ---
export const rangoPeriodo = () => {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - 6)
  return { desde: aISO(desde), hasta: aISO(hoy) }
}

export const diasDelPeriodo = () => {
  const { desde } = rangoPeriodo()
  const inicio = new Date(`${desde}T00:00`)
  const dias = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    dias.push(d)
  }
  return dias
}

export const etiquetaRango = () => {
  const dias = diasDelPeriodo()
  const primero = dias[0]
  const ultimo = dias[dias.length - 1]
  const mes = MESES[ultimo.getMonth()]
  const mismoMes = primero.getMonth() === ultimo.getMonth()
  return mismoMes
    ? `${primero.getDate()}–${ultimo.getDate()} ${mes} ${ultimo.getFullYear()}`
    : `${primero.getDate()} ${MESES[primero.getMonth()]} – ${ultimo.getDate()} ${mes} ${ultimo.getFullYear()}`
}

// --- Resumen del inventario ---
export const resumenInventario = async () => {
  const { data: productos, error: errorProductos } = await productService.getProductsActivos()
  const { desde, hasta } = rangoPeriodo()
  const { data: movimientos, error: errorMovimientos } = await movementService.filtrarHistorial({
    desde,
    hasta,
    orden: 'desc',
    limite: 1000
  })

  const lista = productos ?? []
  const movs = movimientos ?? []
  const delPeriodo = movs.filter((m) => enRangoFechas(m.fecha_hora, desde, hasta))

  const entradas = delPeriodo
    .filter((m) => m.tipo_movimiento === 'Entrada')
    .reduce((total, m) => total + Number(m.cantidad), 0)
  const salidas = delPeriodo
    .filter((m) => m.tipo_movimiento === 'Salida')
    .reduce((total, m) => total + Number(m.cantidad), 0)

  return {
    totalProductos: lista.length,
    totalUnidades: lista.reduce((total, p) => total + Number(p.stock_actual || 0), 0),
    totalCategorias: new Set(lista.map((p) => p.id_categoria)).size,
    stockBajo: lista.filter((p) => estadoStock(p) === 'bajo').length,
    agotados: lista.filter((p) => estadoStock(p) === 'agotado').length,
    entradas,
    salidas,
    neto: entradas - salidas,
    errorProductos,
    errorMovimientos
  }
}

// --- Existencias por categoría ---
export const existenciasPorCategoria = async () => {
  const { data: productos } = await productService.getProductsActivos()
  const mapa = new Map()

  ;(productos ?? []).forEach((producto) => {
    const clave = producto.id_categoria
    const actual = mapa.get(clave) || { id_categoria: clave, nombre: producto.categoria_nombre || 'Sin categoría', unidades: 0 }
    actual.unidades += Number(producto.stock_actual || 0)
    mapa.set(clave, actual)
  })

  return [...mapa.values()].sort((a, b) => b.unidades - a.unidades)
}

// --- Productos por debajo del mínimo o agotados (RN11) ---
export const productosQueNecesitanAtencion = async () => {
  const { data: productos } = await productService.getProductsActivos()
  return (productos ?? [])
    .map((producto) => ({ producto, estado: estadoStock(producto) }))
    .filter(({ estado }) => estado !== 'suficiente')
    .map(({ producto, estado }) => ({
      producto,
      estado,
      faltante: Math.max(producto.stock_minimo - producto.stock_actual, 0)
    }))
    .sort((a, b) => b.faltante - a.faltante)
}

// --- Series diarias de los últimos 7 días ---
export const serieExistencias = async (idProducto = null) => {
  const { data: productosData } = idProducto
    ? await productService.getProductById(idProducto).then(({ data }) => ({ data: data ? [data] : [] }))
    : await productService.getProductsActivos()

  const productos = productosData ?? []
  const dias = diasDelPeriodo()
  const { data: movimientosData } = idProducto
    ? await movementService.getMovementsByProduct(idProducto)
    : await movementService.getMovements({ limite: 1000 })

  const movimientos = movimientosData ?? []
  const totalActual = productos.reduce((total, p) => total + Number(p.stock_actual || 0), 0)

  const valores = dias.map((dia) => {
    const cierre = finDeDia(dia)
    const posteriores = movimientos
      .filter((m) => instanteDe(m.fecha_hora) > cierre)
      .reduce((total, m) => total + (m.tipo_movimiento === 'Entrada' ? Number(m.cantidad) : -Number(m.cantidad)), 0)
    return totalActual - posteriores
  })

  return {
    etiquetas: dias.map((dia) => `${dia.getDate()} ${MESES[dia.getMonth()]}`),
    valores,
    desde: dias[0],
    hasta: dias[dias.length - 1]
  }
}

export const entradasSalidasPorDia = async () => {
  const dias = diasDelPeriodo()
  const { desde, hasta } = rangoPeriodo()
  const { data: movimientosData } = await movementService.filtrarHistorial({ desde, hasta, orden: 'asc', limite: 1000 })
  const delPeriodo = movimientosData ?? []

  const porDia = (dia, tipo) =>
    delPeriodo
      .filter((m) => m.tipo_movimiento === tipo && enRangoFechas(m.fecha_hora, dia, dia))
      .reduce((total, m) => total + Number(m.cantidad), 0)

  const entradas = dias.map((dia) => porDia(dia, 'Entrada'))
  const salidas = dias.map((dia) => porDia(dia, 'Salida'))

  return {
    dias,
    etiquetas: dias.map((dia) => String(dia.getDate())),
    entradas,
    salidas,
    detalle: dias.map((dia, indice) => ({
      dia: dia.getDate(),
      entrada: entradas[indice],
      salida: salidas[indice]
    }))
  }
}

// --- Movimientos recientes ---
export const movimientosRecientes = async (limite = 5) => {
  const { data } = await movementService.getMovements({ limite })
  return data ?? []
}

// --- Movimientos de un producto ---
export const movimientosDeProducto = async (idProducto) => {
  const { data } = await movementService.getMovementsByProduct(idProducto)
  return data ?? []
}

// --- Totales de un conjunto de movimientos ---
export const totalesDe = (movimientos) => movementService.calcularTotales(movimientos)
