export const roles = [
  {
    id_rol: 1,
    nombre: 'Administrador',
    descripcion: 'Acceso completo: puede gestionar productos, definir stock mínimo y consultar todo el inventario.'
  },
  {
    id_rol: 2,
    nombre: 'Operador',
    descripcion: 'Acceso acotado: puede consultar el catálogo y registrar movimientos autorizados.'
  }
]

export const ROLES = {
  ADMIN: 1,
  OPERADOR: 2
}

export const getRoleName = (idRol) => {
  const rol = roles.find(r => r.id_rol === idRol)
  return rol ? rol.nombre : 'Sin rol'
}
