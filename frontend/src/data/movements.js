export const movements = [
  {
    id_movimiento: 1,
    id_producto: 1,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 50,
    fecha_hora: '2026-09-15 10:30:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 2,
    id_producto: 2,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 20,
    fecha_hora: '2026-09-10 09:15:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 3,
    id_producto: 3,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 10,
    fecha_hora: '2026-09-12 11:00:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 4,
    id_producto: 4,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 5,
    fecha_hora: '2026-09-08 08:45:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 5,
    id_producto: 5,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 30,
    fecha_hora: '2026-09-14 14:20:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 6,
    id_producto: 6,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 60,
    fecha_hora: '2026-09-11 10:00:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 7,
    id_producto: 7,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 5,
    fecha_hora: '2026-09-09 16:30:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 8,
    id_producto: 8,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 12,
    fecha_hora: '2026-09-13 12:15:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 9,
    id_producto: 9,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 35,
    fecha_hora: '2026-09-16 09:00:00',
    observacion: 'Stock inicial - lote de proveedor'
  },
  {
    id_movimiento: 10,
    id_producto: 3,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 3,
    fecha_hora: '2026-09-18 10:15:00',
    observacion: 'Venta a cliente - factura N° 001'
  },
  {
    id_movimiento: 11,
    id_producto: 4,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 1,
    fecha_hora: '2026-09-19 11:30:00',
    observacion: 'Venta a cliente - factura N° 002'
  },
  {
    id_movimiento: 12,
    id_producto: 2,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 5,
    fecha_hora: '2026-09-20 09:45:00',
    observacion: 'Venta a cliente - factura N° 003'
  },
  {
    id_movimiento: 13,
    id_producto: 1,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 34,
    fecha_hora: '2026-09-21 14:00:00',
    observacion: 'Reposición - lote de proveedor'
  }
]

export const addMovement = (movement) => {
  movements.push(movement)
}

export const getMovementsByProduct = (idProducto) => {
  return movements.filter(m => m.id_producto === idProducto)
}

export const getMovementTypeLabel = (tipo) => {
  return tipo === 'Entrada' ? 'Entrada' : 'Salida'
}
