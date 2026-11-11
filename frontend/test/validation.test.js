// Pruebas unitarias de las validaciones de formularios (RN03, RN04, RN05, RN12).
import { describe, it, expect } from 'vitest'
import {
  esEnteroPositivo,
  esEnteroNoNegativo,
  esPrecioValido,
  codigoTieneFormatoValido,
  validarProducto,
  validarMovimiento,
  hayErrores
} from '@/utils/validation'

const CATEGORIAS = [
  { id_categoria: 1, nombre: 'Velas' },
  { id_categoria: 2, nombre: 'Difusores' }
]

const BASE_PRODUCTO = {
  nombre: 'Vela de soja · Ámbar',
  codigo: 'VEL-001',
  id_categoria: 1,
  unidad_medida: 'Unidad',
  precio: '4500',
  stock_minimo: '10',
  cantidad_inicial: '0',
  descripcion: ''
}

describe('esEnteroPositivo', () => {
  it('acepta enteros positivos', () => {
    expect(esEnteroPositivo('1')).toBe(true)
    expect(esEnteroPositivo('36')).toBe(true)
  })

  it('rechaza cero, negativos, decimales y texto', () => {
    expect(esEnteroPositivo('0')).toBe(false)
    expect(esEnteroPositivo('-3')).toBe(false)
    expect(esEnteroPositivo('2.5')).toBe(false)
    expect(esEnteroPositivo('abc')).toBe(false)
    expect(esEnteroPositivo('')).toBe(false)
  })
})

describe('esEnteroNoNegativo', () => {
  it('acepta cero y positivos', () => {
    expect(esEnteroNoNegativo('0')).toBe(true)
    expect(esEnteroNoNegativo('84')).toBe(true)
  })

  it('rechaza negativos y no enteros', () => {
    expect(esEnteroNoNegativo('-1')).toBe(false)
    expect(esEnteroNoNegativo('1.5')).toBe(false)
  })
})

describe('esPrecioValido', () => {
  it('acepta precios positivos con hasta 2 decimales', () => {
    expect(esPrecioValido('4500')).toBe(true)
    expect(esPrecioValido('4500.50')).toBe(true)
    expect(esPrecioValido('0.99')).toBe(true)
  })

  it('rechaza cero, negativos y más de 2 decimales', () => {
    expect(esPrecioValido('0')).toBe(false)
    expect(esPrecioValido('-100')).toBe(false)
    expect(esPrecioValido('10.999')).toBe(false)
  })
})

describe('codigoTieneFormatoValido', () => {
  it('acepta letras, números y guiones empezando por alfanumérico', () => {
    expect(codigoTieneFormatoValido('VEL-001')).toBe(true)
    expect(codigoTieneFormatoValido('A1')).toBe(true)
  })

  it('rechaza espacios, guiones iniciales y caracteres especiales', () => {
    expect(codigoTieneFormatoValido('VEL 001')).toBe(false)
    expect(codigoTieneFormatoValido('-VEL')).toBe(false)
    expect(codigoTieneFormatoValido('VEL_001')).toBe(false)
  })
})

describe('validarProducto', () => {
  it('no devuelve errores con datos válidos', () => {
    const errores = validarProducto(BASE_PRODUCTO, { categorias: CATEGORIAS })
    expect(hayErrores(errores)).toBe(false)
  })

  it('exige nombre, SKU, categoría, unidad, precio y stock mínimo', () => {
    const errores = validarProducto(
      { ...BASE_PRODUCTO, nombre: '', codigo: '', id_categoria: '', unidad_medida: '', precio: '', stock_minimo: '' },
      { categorias: CATEGORIAS }
    )
    expect(errores.nombre).toBeTruthy()
    expect(errores.codigo).toBeTruthy()
    expect(errores.id_categoria).toBeTruthy()
    expect(errores.unidad_medida).toBeTruthy()
    expect(errores.precio).toBeTruthy()
    expect(errores.stock_minimo).toBeTruthy()
  })

  it('rechaza un SKU duplicado cuando se le informa', () => {
    const errores = validarProducto(BASE_PRODUCTO, { codigoDuplicado: true, categorias: CATEGORIAS })
    expect(errores.codigo).toMatch(/ya existe/i)
  })

  it('rechaza categoría que no está en la lista vigente', () => {
    const errores = validarProducto({ ...BASE_PRODUCTO, id_categoria: 99 }, { categorias: CATEGORIAS })
    expect(errores.id_categoria).toBeTruthy()
  })

  it('exige stock inicial solo en el alta', () => {
    const erroresAlta = validarProducto({ ...BASE_PRODUCTO, cantidad_inicial: '' }, { categorias: CATEGORIAS })
    expect(erroresAlta.cantidad_inicial).toBeTruthy()

    const erroresEdicion = validarProducto(
      { ...BASE_PRODUCTO, cantidad_inicial: '' },
      { esEdicion: true, categorias: CATEGORIAS }
    )
    expect(erroresEdicion.cantidad_inicial).toBeUndefined()
  })
})

describe('validarMovimiento', () => {
  const producto = { id_producto: 1, nombre: 'Vela', stock_actual: 5, activo: true }

  it('no devuelve errores con un movimiento válido', () => {
    const errores = validarMovimiento(
      { id_producto: 1, tipo_movimiento: 'Salida', cantidad: '5', motivo: 'Entrega de pedidos' },
      producto
    )
    expect(hayErrores(errores)).toBe(false)
  })

  it('rechaza cantidades nulas o negativas (RN04)', () => {
    for (const cantidad of ['0', '-2', 'abc', '']) {
      const errores = validarMovimiento(
        { id_producto: 1, tipo_movimiento: 'Entrada', cantidad, motivo: 'Producción terminada' },
        producto
      )
      expect(errores.cantidad).toBeTruthy()
    }
  })

  it('rechaza salidas superiores al stock disponible (RN05)', () => {
    const errores = validarMovimiento(
      { id_producto: 1, tipo_movimiento: 'Salida', cantidad: '6', motivo: 'Entrega de pedidos' },
      producto
    )
    expect(errores.cantidad).toMatch(/stock disponible/i)
  })

  it('permite salidas iguales al stock disponible', () => {
    const errores = validarMovimiento(
      { id_producto: 1, tipo_movimiento: 'Salida', cantidad: '5', motivo: 'Entrega de pedidos' },
      producto
    )
    expect(errores.cantidad).toBeUndefined()
  })

  it('exige producto, tipo y motivo', () => {
    const errores = validarMovimiento(
      { id_producto: '', tipo_movimiento: '', cantidad: '3', motivo: '' },
      null
    )
    expect(errores.id_producto).toBeTruthy()
    expect(errores.tipo_movimiento).toBeTruthy()
    expect(errores.motivo).toBeTruthy()
  })

  it('rechaza movimientos sobre productos inactivos', () => {
    const errores = validarMovimiento(
      { id_producto: 1, tipo_movimiento: 'Entrada', cantidad: '3', motivo: 'Producción terminada' },
      { ...producto, activo: false }
    )
    expect(errores.id_producto).toMatch(/inactivo/i)
  })
})
