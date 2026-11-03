// Movimientos de stock del período 21-27 oct 2026 (14 registros).
// Entradas del período: +64 u. · Salidas: -38 u. · Neto: +26 u.
// El saldo de cada fila no se almacena: se recalcula desde el stock actual.

export const movements = [
  {
    id_movimiento: 1,
    id_producto: 8,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 7,
    fecha_hora: '2026-10-22 09:20',
    motivo: 'Entrada de proveedor',
    observacion: 'Primera tanda de la orden de compra 1042.'
  },
  {
    id_movimiento: 2,
    id_producto: 8,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 5,
    fecha_hora: '2026-10-22 11:40',
    motivo: 'Entrada de proveedor',
    observacion: 'Segunda tanda de la orden de compra 1042.'
  },
  {
    id_movimiento: 3,
    id_producto: 1,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 8,
    fecha_hora: '2026-10-23 12:15',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido mayorista 231.'
  },
  {
    id_movimiento: 4,
    id_producto: 4,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 10,
    fecha_hora: '2026-10-24 10:05',
    motivo: 'Producción terminada',
    observacion: 'Lote de difusores Bosque.'
  },
  {
    id_movimiento: 5,
    id_producto: 4,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 6,
    fecha_hora: '2026-10-24 15:30',
    motivo: 'Producción terminada',
    observacion: 'Segunda tanda del lote.'
  },
  {
    id_movimiento: 6,
    id_producto: 5,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 2,
    fecha_hora: '2026-10-24 17:20',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido minorista 118.'
  },
  {
    id_movimiento: 7,
    id_producto: 5,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 2,
    fecha_hora: '2026-10-24 18:05',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido minorista 119.'
  },
  {
    id_movimiento: 8,
    id_producto: 2,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 12,
    fecha_hora: '2026-10-25 11:05',
    motivo: 'Producción terminada',
    observacion: 'Lote de velas Lino.'
  },
  {
    id_movimiento: 9,
    id_producto: 6,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 3,
    fecha_hora: '2026-10-25 16:40',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido minorista 124.'
  },
  {
    id_movimiento: 10,
    id_producto: 1,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 8,
    fecha_hora: '2026-10-26 11:00',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido mayorista 236.'
  },
  {
    id_movimiento: 11,
    id_producto: 5,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 6,
    fecha_hora: '2026-10-26 16:20',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido minorista 131.'
  },
  {
    id_movimiento: 12,
    id_producto: 6,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 4,
    fecha_hora: '2026-10-26 17:40',
    motivo: 'Entrega de pedidos',
    observacion: 'Pedido minorista 132.'
  },
  {
    id_movimiento: 13,
    id_producto: 7,
    id_usuario: 2,
    tipo_movimiento: 'Salida',
    cantidad: 5,
    fecha_hora: '2026-10-27 09:15',
    motivo: 'Entrega de pedidos',
    observacion: 'Últimas unidades del aroma cedro.'
  },
  {
    id_movimiento: 14,
    id_producto: 1,
    id_usuario: 1,
    tipo_movimiento: 'Entrada',
    cantidad: 24,
    fecha_hora: '2026-10-27 10:30',
    motivo: 'Producción terminada',
    observacion: 'Lote grande para la próxima temporada.'
  }
]
