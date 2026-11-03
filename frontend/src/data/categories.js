export const categories = [
  { id_categoria: 1, nombre: 'Velas', descripcion: 'Velas aromáticas de soja y parafina.' },
  { id_categoria: 2, nombre: 'Difusores', descripcion: 'Difusores de ambiente con varillas.' },
  { id_categoria: 3, nombre: 'Home sprays', descripcion: 'Sprays y atomizadores de fragancia para el hogar.' },
  { id_categoria: 4, nombre: 'Repuestos', descripcion: 'Repuestos, mechas y recargas del catálogo.' }
]

export const getCategoryById = (idCategoria) =>
  categories.find(c => c.id_categoria === Number(idCategoria))

export const getCategoryName = (idCategoria) =>
  getCategoryById(idCategoria)?.nombre || '-'
