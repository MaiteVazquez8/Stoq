// Validaciones de formularios (RN03, RN04, RN05, RN12).
// Devuelven un objeto de errores por campo; si está vacío, el formulario es válido.
// Las validaciones de negocio críticas (stock, permisos) se re-verifican
// también en la base de datos (constraints + RPC); acá se valida formato y
// coherencia básica para dar feedback inmediato al usuario.

const PATRON_CODIGO = /^[A-Za-z0-9][A-Za-z0-9-]*$/

export const esEnteroPositivo = (valor) =>
  /^\d+$/.test(String(valor).trim()) && Number(valor) > 0

export const esEnteroNoNegativo = (valor) =>
  /^\d+$/.test(String(valor).trim()) && Number(valor) >= 0

export const esPrecioValido = (valor) => {
  const numero = Number(valor)
  return (
    String(valor).trim() !== '' &&
    !Number.isNaN(numero) &&
    numero > 0 &&
    Math.round(numero * 100) / 100 === numero
  )
}

export const codigoTieneFormatoValido = (valor) => PATRON_CODIGO.test(String(valor || '').trim())

/**
 * Valida el formulario de producto (alta y edición).
 * @param {object} borrador campos del formulario
 * @param {object} opciones {
 *   esEdicion: boolean,
 *   codigoDuplicado: boolean,
 *   categorias: Array<{ id_categoria: number }> — lista vigente cargada de Supabase;
 *               si se omite, solo se valida que haya una selección.
 * }
 */
export const validarProducto = (borrador, opciones = {}) => {
  const errores = {}
  const { esEdicion = false, codigoDuplicado = false, categorias = null } = opciones

  if (!String(borrador.nombre || '').trim()) {
    errores.nombre = 'Ingresá el nombre del producto.'
  } else if (String(borrador.nombre).trim().length < 2) {
    errores.nombre = 'El nombre necesita al menos 2 caracteres.'
  }

  const codigo = String(borrador.codigo || '').trim()
  if (!codigo) {
    errores.codigo = 'Ingresá el SKU del producto.'
  } else if (!codigoTieneFormatoValido(codigo)) {
    errores.codigo = 'Usá letras, números y guiones. Ej.: VEL-004.'
  } else if (codigoDuplicado) {
    errores.codigo = 'Este SKU ya existe. Usá un código único.'
  }

  if (!borrador.id_categoria) {
    errores.id_categoria = 'Elegí una categoría disponible.'
  } else if (Array.isArray(categorias)) {
    const existe = categorias.some(
      (categoria) => Number(categoria.id_categoria) === Number(borrador.id_categoria)
    )
    if (!existe) {
      errores.id_categoria = 'La categoría seleccionada no existe.'
    }
  }

  if (!borrador.unidad_medida) {
    errores.unidad_medida = 'Elegí la unidad de medida.'
  } else if (!['Unidad', 'Pack', 'Caja'].includes(borrador.unidad_medida)) {
    errores.unidad_medida = 'La unidad de medida seleccionada no es válida.'
  }

  if (!esPrecioValido(borrador.precio)) {
    errores.precio = 'Ingresá un precio mayor a 0, con hasta 2 decimales.'
  }

  if (!esEdicion && !esEnteroNoNegativo(borrador.cantidad_inicial)) {
    errores.cantidad_inicial = 'Ingresá una cantidad entera igual o mayor a 0.'
  }

  if (!esEnteroNoNegativo(borrador.stock_minimo === '' ? 'x' : borrador.stock_minimo)) {
    errores.stock_minimo = 'El stock mínimo debe ser un número entero igual o mayor a 0.'
  }

  return errores
}

/**
 * Valida un movimiento de stock (RN04, RN05, RN12).
 */
export const validarMovimiento = (borrador, producto) => {
  const errores = {}

  if (!borrador.id_producto) {
    errores.id_producto = 'Elegí el producto del movimiento.'
  } else if (!producto) {
    errores.id_producto = 'El producto seleccionado no existe.'
  } else if (producto.activo === false) {
    errores.id_producto = 'El producto está inactivo. Reactivalo para registrar movimientos.'
  }

  if (!borrador.tipo_movimiento) {
    errores.tipo_movimiento = 'Elegí si es una entrada o una salida.'
  } else if (!['Entrada', 'Salida'].includes(borrador.tipo_movimiento)) {
    errores.tipo_movimiento = 'El tipo de movimiento no es válido.'
  }

  if (!esEnteroPositivo(borrador.cantidad)) {
    errores.cantidad = 'Ingresá una cantidad entera mayor a 0.'
  } else if (producto && borrador.tipo_movimiento === 'Salida') {
    const cantidad = Number(borrador.cantidad)
    if (cantidad > producto.stock_actual) {
      errores.cantidad = `La cantidad supera el stock disponible. Tenés ${producto.stock_actual} unidades. Ingresá una cantidad entre 1 y ${producto.stock_actual} para registrar la salida.`
    }
  }

  if (!borrador.motivo) {
    errores.motivo = 'Elegí el motivo del movimiento.'
  }

  return errores
}

export const hayErrores = (errores) => Object.keys(errores).length > 0
