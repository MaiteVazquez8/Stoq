export const users = [
  {
    id_usuario: 1,
    nombre: 'Administrador Stoq',
    email: 'admin@stoq.com',
    id_rol: 1,
    estado: 'activo'
  },
  {
    id_usuario: 2,
    nombre: 'María González',
    email: 'operadora@stoq.com',
    id_rol: 2,
    estado: 'activo'
  }
]

export const getUserByEmail = (email) => {
  return users.find(u => u.email === email)
}

export const getUserRole = (user) => {
  return user ? user.id_rol : null
}
