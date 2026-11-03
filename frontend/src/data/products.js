// Catálogo de prueba de Casa Nube (emprendimiento ficticio).
// Las existencias son coherentes con los movimientos registrados en movements.js:
// el saldo inicial del período 21-27 oct 2026 es de 236 unidades y el actual, 262.

export const products = [
  {
    id_producto: 1,
    codigo: 'VEL-001',
    nombre: 'Vela de soja · Ámbar',
    descripcion: 'Vela de soja de 200 g. Aroma ámbar. Frasco de vidrio.',
    id_categoria: 1,
    unidad_medida: 'Unidad',
    precio: 4500,
    stock_actual: 84,
    stock_minimo: 20,
    fecha_creacion: '2026-09-01'
  },
  {
    id_producto: 2,
    codigo: 'VEL-002',
    nombre: 'Vela de soja · Lino',
    descripcion: 'Vela de soja de 200 g. Aroma lino. Frasco de vidrio.',
    id_categoria: 1,
    unidad_medida: 'Unidad',
    precio: 4500,
    stock_actual: 56,
    stock_minimo: 20,
    fecha_creacion: '2026-09-01'
  },
  {
    id_producto: 3,
    codigo: 'VEL-003',
    nombre: 'Vela de soja · Canela',
    descripcion: 'Vela de soja de 200 g. Aroma canela. Frasco de vidrio.',
    id_categoria: 1,
    unidad_medida: 'Unidad',
    precio: 4700,
    stock_actual: 30,
    stock_minimo: 12,
    fecha_creacion: '2026-09-22'
  },
  {
    id_producto: 4,
    codigo: 'DIF-001',
    nombre: 'Difusor · Bosque',
    descripcion: 'Difusor de ambiente de 250 ml con varillas de mimbre.',
    id_categoria: 2,
    unidad_medida: 'Unidad',
    precio: 8900,
    stock_actual: 42,
    stock_minimo: 12,
    fecha_creacion: '2026-09-05'
  },
  {
    id_producto: 5,
    codigo: 'DIF-002',
    nombre: 'Difusor · Cítrico',
    descripcion: 'Difusor de ambiente de 250 ml con varillas de mimbre.',
    id_categoria: 2,
    unidad_medida: 'Unidad',
    precio: 8900,
    stock_actual: 18,
    stock_minimo: 20,
    fecha_creacion: '2026-09-05'
  },
  {
    id_producto: 6,
    codigo: 'SPR-001',
    nombre: 'Home spray · Bruma',
    descripcion: 'Home spray de 100 ml. Aroma bruma y eucalipto.',
    id_categoria: 3,
    unidad_medida: 'Unidad',
    precio: 5200,
    stock_actual: 8,
    stock_minimo: 10,
    fecha_creacion: '2026-09-12'
  },
  {
    id_producto: 7,
    codigo: 'SPR-002',
    nombre: 'Home spray · Cedro',
    descripcion: 'Home spray de 100 ml. Aroma cedro y vetiver.',
    id_categoria: 3,
    unidad_medida: 'Unidad',
    precio: 5200,
    stock_actual: 0,
    stock_minimo: 10,
    fecha_creacion: '2026-09-12'
  },
  {
    id_producto: 8,
    codigo: 'REP-001',
    nombre: 'Repuesto de mecha',
    descripcion: 'Kit de repuesto: mecha de algodón y soporte metálico.',
    id_categoria: 4,
    unidad_medida: 'Pack',
    precio: 1900,
    stock_actual: 24,
    stock_minimo: 8,
    fecha_creacion: '2026-09-28'
  }
]

export const getProductById = (idProducto) =>
  products.find(p => p.id_producto === Number(idProducto))

export const getProductByCode = (codigo) =>
  products.find(p => p.codigo.toLowerCase() === String(codigo || '').trim().toLowerCase())
