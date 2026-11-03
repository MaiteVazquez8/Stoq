// Motivos registrados en cada movimiento (entrada / salida).

export const motivosEntrada = [
  'Entrada de proveedor',
  'Producción terminada',
  'Devolución de cliente',
  'Ajuste de inventario'
]

export const motivosSalida = [
  'Entrega de pedidos',
  'Venta en local',
  'Producción intermedia',
  'Ajuste de inventario'
]

export const getMotivoOptions = (tipo) =>
  tipo === 'Entrada' ? motivosEntrada : motivosSalida
