// Cálculos derivados del inventario. Las vistas no guardan copias de los datos:
// todo se calcula a partir del estado reactivo del store.

import { getProducts, getMovements, findProduct } from '@/services/store'
import { getCategoryName } from '@/data/categories'
import { negocio } from '@/data/business'

// --- Estado de stock (RN11) ---
export const estadoStock = (producto) => {
  if (!producto) return 'suficiente'
  if (producto.stock_actual <= 0) return 'agotado'
  if (producto.stock_actual < producto.stock_minimo) return 'bajo'
  return 'suficiente'
}

export const etiquetaEstado = (estado) => {
  if (estado === 'agotado') return 'Agotado'
  if (estado === 'bajo') return 'Stock bajo'
  return 'Suficiente'
}

const firma = (movimiento) => `${movimiento.fecha_hora}-${String(movimiento.id_movimiento).padStart(4, '0')}`

const ordenarAscendente = (movimientos) =>
  [...movimientos].sort((a, b) => firma(a).localeCompare(firma(b)))

const ordenarDescendente = (movimientos) =>
  [...movimientos].sort((a, b) => firma(b).localeCompare(firma(a)))

const cantidadFirmada = (movimiento) =>
  movimiento.tipo_movimiento === 'Entrada' ? movimiento.cantidad : -movimiento.cantidad

/**
 * Agrega el saldo resultante a cada movimiento (stock después de la operación).
 * Se calcula hacia atrás desde el stock actual, sin almacenar el saldo.
 */
export const conSaldo = (movimientos) => {
  const saldos = new Map()

  getProducts().forEach(producto => {
    const delProducto = ordenarAscendente(
      getMovements().filter(m => m.id_producto === producto.id_producto)
    )
    let saldo = producto.stock_actual
    for (let i = delProducto.length - 1; i >= 0; i -= 1) {
      saldos.set(delProducto[i].id_movimiento, saldo)
      saldo -= cantidadFirmada(delProducto[i])
    }
  })

  return movimientos.map(m => ({ ...m, saldo: saldos.get(m.id_movimiento) ?? null }))
}

// --- Rangos de fecha del período de demostración (21-27 oct 2026) ---
export const rangoPeriodo = () => {
  const hasta = new Date(`${negocio.hoy.replace(' ', 'T')}:00`)
  const desde = new Date(hasta)
  desde.setDate(desde.getDate() - 6)
  const aTexto = (f) => {
    const mes = String(f.getMonth() + 1).padStart(2, '0')
    const dia = String(f.getDate()).padStart(2, '0')
    return `${f.getFullYear()}-${mes}-${dia}`
  }
  return { desde: aTexto(desde), hasta: aTexto(hasta) }
}

export const diasDelPeriodo = () => {
  const { desde, hasta } = rangoPeriodo()
  const inicio = new Date(`${desde}T00:00`)
  const fin = new Date(`${hasta}T00:00`)
  const dias = []
  const actual = new Date(inicio)
  while (actual <= fin) {
    dias.push(new Date(actual))
    actual.setDate(actual.getDate() + 1)
  }
  return dias
}

const enRango = (fechaHora, desde, hasta) => {
  const dia = String(fechaHora).slice(0, 10)
  return dia >= desde && dia <= hasta
}

export const movimientosDelPeriodo = () => {
  const { desde, hasta } = rangoPeriodo()
  return getMovements().filter(m => enRango(m.fecha_hora, desde, hasta))
}

// --- Resumen del inventario ---
export const resumenInventario = () => {
  const productos = getProducts()
  const delPeriodo = movimientosDelPeriodo()

  const entradas = delPeriodo
    .filter(m => m.tipo_movimiento === 'Entrada')
    .reduce((total, m) => total + m.cantidad, 0)
  const salidas = delPeriodo
    .filter(m => m.tipo_movimiento === 'Salida')
    .reduce((total, m) => total + m.cantidad, 0)

  const categoriasConStock = new Set(productos.map(p => p.id_categoria)).size

  return {
    totalProductos: productos.length,
    totalUnidades: productos.reduce((total, p) => total + p.stock_actual, 0),
    totalCategorias: categoriasConStock,
    stockBajo: productos.filter(p => estadoStock(p) === 'bajo').length,
    agotados: productos.filter(p => estadoStock(p) === 'agotado').length,
    entradas,
    salidas,
    neto: entradas - salidas
  }
}

export const existenciasPorCategoria = () => {
  const productos = getProducts()
  const mapa = new Map()

  productos.forEach(producto => {
    const actual = mapa.get(producto.id_categoria) || 0
    mapa.set(producto.id_categoria, actual + producto.stock_actual)
  })

  return [...mapa.entries()]
    .map(([idCategoria, unidades]) => ({
      id_categoria: idCategoria,
      nombre: getCategoryName(idCategoria),
      unidades
    }))
    .sort((a, b) => b.unidades - a.unidades)
}

export const productosQueNecesitanAtencion = () =>
  getProducts()
    .map(producto => ({ producto, estado: estadoStock(producto) }))
    .filter(({ estado }) => estado !== 'suficiente')
    .map(({ producto, estado }) => ({
      producto,
      estado,
      faltante: Math.max(producto.stock_minimo - producto.stock_actual, 0)
    }))
    .sort((a, b) => b.faltante - a.faltante)

// --- Series para los gráficos ---
export const serieExistencias = (idProducto = null) => {
  const productos = idProducto
    ? [findProduct(idProducto)].filter(Boolean)
    : getProducts()
  const dias = diasDelPeriodo()
  const movimientos = idProducto
    ? getMovements().filter(m => m.id_producto === Number(idProducto))
    : getMovements()

  const totalActual = productos.reduce((total, p) => total + p.stock_actual, 0)

  const valores = dias.map(dia => {
    const cierre = new Date(dia)
    cierre.setHours(23, 59, 59, 999)
    const posteriores = movimientos
      .filter(m => new Date(`${m.fecha_hora.replace(' ', 'T')}:00`) > cierre)
      .reduce((total, m) => total + cantidadFirmada(m), 0)
    return totalActual - posteriores
  })

  return {
    etiquetas: dias.map(dia => `${dia.getDate()} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][dia.getMonth()]}`),
    valores,
    desde: dias[0],
    hasta: dias[dias.length - 1]
  }
}

export const entradasSalidasPorDia = () => {
  const dias = diasDelPeriodo()
  const movimientos = movimientosDelPeriodo()

  const entradas = dias.map(dia => {
    const clave = String(dia.getDate()).padStart(2, '0')
    return movimientos
      .filter(m => m.tipo_movimiento === 'Entrada' && m.fecha_hora.slice(8, 10) === clave)
      .reduce((total, m) => total + m.cantidad, 0)
  })

  const salidas = dias.map(dia => {
    const clave = String(dia.getDate()).padStart(2, '0')
    return movimientos
      .filter(m => m.tipo_movimiento === 'Salida' && m.fecha_hora.slice(8, 10) === clave)
      .reduce((total, m) => total + m.cantidad, 0)
  })

  return {
    dias,
    etiquetas: dias.map(dia => String(dia.getDate())),
    entradas,
    salidas,
    detalle: dias.map((dia, indice) => ({
      dia: dia.getDate(),
      entrada: entradas[indice],
      salida: salidas[indice]
    }))
  }
}

// --- Historial ---
export const historialConSaldo = () => conSaldo(ordenarDescendente(getMovements()))

export const movimientosRecientes = (limite = 5) => historialConSaldo().slice(0, limite)

export const movimientosDeProducto = (idProducto) =>
  conSaldo(
    ordenarDescendente(getMovements().filter(m => m.id_producto === Number(idProducto)))
  )

export const filtrarHistorial = ({ busqueda = '', tipo = 'todos', desde = null, hasta = null } = {}) => {
  let resultado = historialConSaldo()

  const texto = busqueda.trim().toLowerCase()
  if (texto) {
    resultado = resultado.filter(m => {
      const producto = findProduct(m.id_producto)
      const nombre = producto ? producto.nombre.toLowerCase() : ''
      const codigo = producto ? producto.codigo.toLowerCase() : ''
      const motivo = String(m.motivo || '').toLowerCase()
      const observacion = String(m.observacion || '').toLowerCase()
      return (
        nombre.includes(texto) ||
        codigo.includes(texto) ||
        motivo.includes(texto) ||
        observacion.includes(texto)
      )
    })
  }

  if (tipo !== 'todos') {
    resultado = resultado.filter(m => m.tipo_movimiento === tipo)
  }

  if (desde && hasta) {
    resultado = resultado.filter(m => enRango(m.fecha_hora, desde, hasta))
  }

  return resultado
}

export const totalesDe = (movimientos) => {
  const entradas = movimientos
    .filter(m => m.tipo_movimiento === 'Entrada')
    .reduce((total, m) => total + m.cantidad, 0)
  const salidas = movimientos
    .filter(m => m.tipo_movimiento === 'Salida')
    .reduce((total, m) => total + m.cantidad, 0)
  return { entradas, salidas, neto: entradas - salidas }
}
