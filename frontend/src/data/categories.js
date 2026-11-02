export const categories = [
  { id_categoria: 1, nombre: 'Informática', descripcion: 'Equipos y accesorios de computación.' },
  { id_categoria: 2, nombre: 'Audio', descripcion: 'Dispositivos de sonido y auriculares.' },
  { id_categoria: 3, nombre: 'Accesorios', descripcion: 'Cables, adaptadores y complementos.' },
  { id_categoria: 4, nombre: 'Periféricos', descripcion: 'Teclados, ratones y dispositivos de entrada.' }
]

export const getCategoryName = (id) => {
  const cat = categories.find(c => c.id_categoria === id)
  return cat ? cat.nombre : '-'
}
