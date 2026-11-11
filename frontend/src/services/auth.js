// ============================================================================
// Stoq · Servicio de autenticación con Supabase Auth
// ============================================================================
// Credenciales y sesión: gestionadas por Supabase Auth.
// Perfil de aplicación (nombre, rol, estado): tabla public.usuarios,
// que se vincula 1 a 1 con auth.users y se crea automáticamente mediante
// el trigger handle_new_user (ver scripts/db.sql).
// ============================================================================

import { supabase, manejarErrorSupabase, extraerDatos } from './supabase'

// Normaliza el perfil de public.usuarios (con su rol) al objeto de sesión
export const normalizarPerfil = (perfil, email) => ({
  id: perfil.id_usuario,
  email: perfil.email || email,
  nombre: perfil.nombre || '',
  id_rol: perfil.id_rol ?? 2,
  estado: perfil.estado || 'activo'
})

// --- Obtener el perfil de un usuario de Auth ---
export const obtenerPerfilPorAuthId = async (authId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, email, id_rol, estado')
    .eq('id_usuario', authId)
    .maybeSingle()

  return extraerDatos({ data, error })
}

// --- Sesión actual ---
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return extraerDatos({ data: data.session, error })
}

// --- Inicio de sesión ---
export const iniciarSesion = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return manejarErrorSupabase(error, 'iniciar sesión')
  }

  if (!data.user) {
    return { success: false, error: 'No se pudo obtener la sesión del usuario.' }
  }

  // El perfil de la aplicación lo crea el trigger handle_new_user
  const { data: perfil, error: perfilError } = await obtenerPerfilPorAuthId(data.user.id)

  if (perfilError) {
    return manejarErrorSupabase(perfilError, 'obtener perfil de usuario')
  }

  if (!perfil) {
    return {
      success: false,
      error: 'La cuenta existe en autenticación pero no tiene un perfil en el sistema. Contactá al administrador.'
    }
  }

  if (perfil.estado !== 'activo') {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Tu cuenta está desactivada. Contactá al administrador.'
    }
  }

  return {
    success: true,
    user: normalizarPerfil(perfil, data.user.email)
  }
}

// --- Cierre de sesión ---
export const cerrarSesion = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    return manejarErrorSupabase(error, 'cerrar sesión')
  }
  return { success: true }
}

// --- Restablecer contraseña ---
export const restablecerContrasena = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/ingresar`
  })

  if (error) {
    return manejarErrorSupabase(error, 'restablecer contraseña')
  }

  return { success: true }
}

// --- Obtener perfil del usuario autenticado ---
export const obtenerPerfilUsuario = async (idUsuario) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, roles(nombre, descripcion)')
    .eq('id_usuario', idUsuario)
    .single()

  return extraerDatos({ data, error })
}


