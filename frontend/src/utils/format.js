// Funciones auxiliares de formato. Toda la app muestra fechas y cantidades
// con estos helpers para que códigos, precios y fechas se lean igual.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Parseo seguro de 'YYYY-MM-DD' y 'YYYY-MM-DD HH:mm'
export const parseFecha = (valor) => {
  if (!valor) return null
  if (valor instanceof Date) return valor
  const texto = String(valor).trim().replace(' ', 'T')
  const fecha = new Date(texto.length === 10 ? `${texto}T00:00` : texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(Number(valor) || 0)

export const formatNumero = (valor) =>
  new Intl.NumberFormat('es-AR').format(Number(valor) || 0)

export const formatUnidades = (cantidad) => `${formatNumero(cantidad)} u.`

export const formatUnidadesLargas = (cantidad) => {
  const numero = Number(cantidad) || 0
  return `${formatNumero(numero)} ${numero === 1 ? 'unidad' : 'unidades'}`
}

export const formatCantidadConSigno = (tipo, cantidad) =>
  `${tipo === 'Entrada' ? '+' : '–'}${formatUnidades(cantidad)}`

export const formatFechaCorta = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}`
}

export const formatHora = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

export const formatFechaHoraCorta = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${formatFechaCorta(fecha)} · ${formatHora(fecha)}`
}

export const formatFechaNumerica = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${fecha.getFullYear()}`
}

export const formatFechaLarga = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}, ${formatHora(fecha)}`
}

export const formatFechaConMes = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
}

export const formatEtiquetaDia = (valor) => {
  const fecha = parseFecha(valor)
  if (!fecha) return '-'
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}`
}

export const formatRangoFechas = (desde, hasta) => {
  const inicio = parseFecha(desde)
  const fin = parseFecha(hasta)
  if (!inicio || !fin) return '-'
  const mismoMes = inicio.getMonth() === fin.getMonth()
  const desdeTexto = mismoMes ? String(inicio.getDate()) : formatFechaCorta(inicio)
  return `${desdeTexto}–${formatFechaCorta(fin)} ${fin.getFullYear()}`
}

// "27/10/2026 · 11:00"
export const formatFechaHoraNumerica = (valor) =>
  `${formatFechaNumerica(valor)} · ${formatHora(valor)}`
