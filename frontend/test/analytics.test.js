// Pruebas unitarias de cálculos derivados del inventario.
import { describe, it, expect } from 'vitest'
import { estadoStock, totalesDe, rangoPeriodo, diasDelPeriodo } from '@/services/analytics'

describe('estadoStock (RN11)', () => {
  it('marca agotado cuando no hay unidades', () => {
    expect(estadoStock({ stock_actual: 0, stock_minimo: 10 })).toBe('agotado')
  })

  it('marca bajo cuando está por debajo del mínimo', () => {
    expect(estadoStock({ stock_actual: 9, stock_minimo: 10 })).toBe('bajo')
  })

  it('marca suficiente en el límite exacto del mínimo (10 con mínimo 10)', () => {
    expect(estadoStock({ stock_actual: 10, stock_minimo: 10 })).toBe('suficiente')
  })

  it('marca suficiente por encima del mínimo', () => {
    expect(estadoStock({ stock_actual: 30, stock_minimo: 10 })).toBe('suficiente')
  })
})

describe('totalesDe', () => {
  it('suma entradas, salidas y calcula el neto', () => {
    const totales = totalesDe([
      { tipo_movimiento: 'Entrada', cantidad: 10 },
      { tipo_movimiento: 'Entrada', cantidad: 5 },
      { tipo_movimiento: 'Salida', cantidad: 4 }
    ])
    expect(totales).toEqual({ entradas: 15, salidas: 4, neto: 11 })
  })

  it('devuelve ceros con una lista vacía', () => {
    expect(totalesDe([])).toEqual({ entradas: 0, salidas: 0, neto: 0 })
  })
})

describe('rangoPeriodo', () => {
  it('cubre 7 días corridos terminando hoy', () => {
    const { desde, hasta } = rangoPeriodo()
    const dias = diasDelPeriodo()
    const aISO = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    expect(dias).toHaveLength(7)
    expect(desde).toBe(aISO(dias[0]))
    expect(hasta).toBe(aISO(new Date()))
  })
})
