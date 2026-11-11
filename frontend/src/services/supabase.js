// ============================================================================
// Stoq · Configuración de Supabase
// Cliente centralizado de Supabase para toda la aplicación.
// ============================================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase: faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Helper para manejar errores de Supabase de forma consistente
export const manejarErrorSupabase = (error, contexto = 'operación') => {
  if (!error) return null

  const mensaje = error.message || `Error al ${contexto}.`
  const codigo = error.code || ''
  const detalles = error.details || ''

  console.error(`[Supabase] Error en ${contexto}:`, {
    codigo,
    mensaje,
    detalles
  })

  return {
    success: false,
    error: mensaje,
    codigo,
    detalles
  }
}

// Helper para extraer datos de una respuesta de Supabase
export const extraerDatos = (response) => {
  if (response.error) {
    return { data: null, error: response.error }
  }
  return { data: response.data ?? null, error: null }
}
