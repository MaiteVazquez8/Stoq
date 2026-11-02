export const products = [
  {
    id_producto: 1,
    codigo: 'VEL-001',
    nombre: 'Vela de soja - Ámbar',
    descripcion: 'Vela aromática de soja con esencia de ámbar. Duración aproximada 40 horas.',
    id_categoria: 1,
    precio: 4500,
    stock_actual: 84,
    stock_minimo: 20,
    fecha_creacion: '2026-09-15'
  },
  {
    id_producto: 2,
    codigo: 'MOU-002',
    nombre: 'Mouse inalámbrico',
    descripcion: 'Mouse óptico inalámbrico ergonómico, conexión USB.',
    id_categoria: 4,
    precio: 8500,
    stock_actual: 12,
    stock_minimo: 10,
    fecha_creacion: '2026-09-10'
  },
  {
    id_producto: 3,
    codigo: 'TEC-003',
    nombre: 'Teclado mecánico',
    descripcion: 'Teclado mecánico con switches azules, retroiluminado.',
    id_categoria: 4,
    precio: 25000,
    stock_actual: 5,
    stock_minimo: 8,
    fecha_creacion: '2026-09-12'
  },
  {
    id_producto: 4,
    codigo: 'MON-004',
    nombre: 'Monitor LED 24"',
    descripcion: 'Monitor LED Full HD 24 pulgadas, puerto HDMI y VGA.',
    id_categoria: 1,
    precio: 89000,
    stock_actual: 3,
    stock_minimo: 4,
    fecha_creacion: '2026-09-08'
  },
  {
    id_producto: 5,
    codigo: 'AUR-005',
    nombre: 'Auriculares',
    descripcion: 'Auriculares diadema con micrófono, conector de 3.5mm.',
    id_categoria: 2,
    precio: 12000,
    stock_actual: 18,
    stock_minimo: 15,
    fecha_creacion: '2026-09-14'
  },
  {
    id_producto: 6,
    codigo: 'USB-006',
    nombre: 'Cable USB',
    descripcion: 'Cable USB tipo C a USB A, 1 metro, carga y transferencia de datos.',
    id_categoria: 3,
    precio: 3500,
    stock_actual: 45,
    stock_minimo: 30,
    fecha_creacion: '2026-09-11'
  },
  {
    id_producto: 7,
    codigo: 'WEB-007',
    nombre: 'Webcam',
    descripcion: 'Webcam Full HD 1080p con micrófono integrado.',
    id_categoria: 1,
    precio: 18000,
    stock_actual: 2,
    stock_minimo: 5,
    fecha_creacion: '2026-09-09'
  },
  {
    id_producto: 8,
    codigo: 'PAR-008',
    nombre: 'Parlantes',
    descripcion: 'Parlantes estéreo USB, potencia 10W RMS.',
    id_categoria: 2,
    precio: 15000,
    stock_actual: 7,
    stock_minimo: 6,
    fecha_creacion: '2026-09-13'
  },
  {
    id_producto: 9,
    codigo: 'ADP-009',
    nombre: 'Adaptador HDMI',
    descripcion: 'Adaptador USB-C a HDMI, soporte 4K.',
    id_categoria: 3,
    precio: 7500,
    stock_actual: 25,
    stock_minimo: 12,
    fecha_creacion: '2026-09-16'
  }
]

export const getProductById = (id) => {
  return products.find(p => p.id_producto === id)
}

export const getProductByCode = (codigo) => {
  return products.find(p => p.codigo === codigo)
}

export const isStockLow = (product) => {
  return product.stock_actual < product.stock_minimo
}
