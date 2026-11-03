// Usuarios de prueba. No almacenar contraseñas ni datos sensibles.
// La autenticación real se implementará posteriormente con Supabase Auth.

export const users = [
  {
    id_usuario: 1,
    nombre: 'Lucía Ríos',
    email: 'lucia@casanube.com.ar',
    id_rol: 1,
    estado: 'activo'
  },
  {
    id_usuario: 2,
    nombre: 'Martín Sosa',
    email: 'martin@casanube.com.ar',
    id_rol: 2,
    estado: 'activo'
  }
]

export const getUserByEmail = (email) => {
  const normalizado = String(email || '').trim().toLowerCase()
  return users.find(u => u.email.toLowerCase() === normalizado)
}

export const getUserById = (idUsuario) =>
  users.find(u => u.id_usuario === Number(idUsuario))

export const getUserDisplayName = (idUsuario) =>
  getUserById(idUsuario)?.nombre || 'Usuario'
