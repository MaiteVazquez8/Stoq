#!/usr/bin/env node
// ============================================================================
// Stoq · Verificación de integración contra Supabase
// ============================================================================
// Ejecuta las comprobaciones mínimas de la Etapa 5 contra la base real:
//
//   1. Anónimo sin sesión no ve registros (RLS).
//   2. Operador no puede crear ni modificar productos (RLS en servidor).
//   3. Operador puede registrar una entrada vía RPC; el stock sube.
//   4. Operador intenta una salida mayor al stock: la RPC la rechaza.
//   5. Un movimiento inexistente/cantidad inválida: rechazados.
//   6. El operador NO puede desactivar productos (RPC admin-only).
//   7. El administrador SÍ puede desactivar/reactivar el producto de prueba.
//   8. SKU duplicado: rechazado por unicidad (código 23505).
//   9. El historial conserva ambos movimientos con su responsable.
//
// USO (desde la carpeta frontend):
//   set STOQ_ADMIN_EMAIL=lucia@casanube.com.ar
//   set STOQ_ADMIN_PASSWORD=...
//   set STOQ_OPERADOR_EMAIL=martin@casanube.com.ar
//   set STOQ_OPERADOR_PASSWORD=...
//   node scripts/verificar.mjs
//
// Crea un producto de prueba (SKU TEST-INTEG) y movimientos de prueba.
// No toca productos ni movimientos existentes del catálogo sembrado.
// Las credenciales se pasan por entorno; nunca se escriben en este archivo.
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  readFileSync(join(raiz, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const URL_SUPABASE = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const CLAVE_PUBLICA = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY

const ADMIN_EMAIL = process.env.STOQ_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.STOQ_ADMIN_PASSWORD
const OPERADOR_EMAIL = process.env.STOQ_OPERADOR_EMAIL
const OPERADOR_PASSWORD = process.env.STOQ_OPERADOR_PASSWORD

if (!URL_SUPABASE || !CLAVE_PUBLICA) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY en frontend/.env')
  process.exit(1)
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !OPERADOR_EMAIL || !OPERADOR_PASSWORD) {
  console.error('Definí STOQ_ADMIN_EMAIL, STOQ_ADMIN_PASSWORD, STOQ_OPERADOR_EMAIL y STOQ_OPERADOR_PASSWORD.')
  process.exit(1)
}

const resultados = []
const registrar = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok, detalle })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ` — ${detalle}` : ''}`)
}

const nuevoCliente = () =>
  createClient(URL_SUPABASE, CLAVE_PUBLICA, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

// --- 1. Acceso anónimo ---
{
  const anon = nuevoCliente()
  const { data, error } = await anon.from('productos').select('id_producto').limit(1)
  registrar('1. El acceso anónimo no ve registros del catálogo', !error && (data?.length ?? 0) === 0, error ? error.message : `${data?.length ?? 0} filas visibles`)
}

// --- Autenticar ambos roles ---
const admin = nuevoCliente()
const operador = nuevoCliente()

const { error: errorLoginAdmin } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
const { error: errorLoginOperador } = await operador.auth.signInWithPassword({ email: OPERADOR_EMAIL, password: OPERADOR_PASSWORD })

if (errorLoginAdmin || errorLoginOperador) {
  console.error('No se pudo iniciar sesión con las credenciales de prueba:', {
    admin: errorLoginAdmin?.message ?? 'ok',
    operador: errorLoginOperador?.message ?? 'ok'
  })
  process.exit(1)
}

const SKU_TEST = 'TEST-INTEG'

// --- 2. Operador no puede escribir en productos ni categorías ---
{
  const { error } = await operador.from('productos').insert([{
    codigo: SKU_TEST,
    nombre: 'Producto de prueba integración',
    id_categoria: 1,
    unidad_medida: 'Unidad',
    precio: 1,
    stock_actual: 0,
    stock_minimo: 0
  }])
  registrar('2a. Operador no puede crear productos directamente (RLS)', Boolean(error), error?.message)
}

// --- Preparar producto de prueba como administrador (idempotente) ---
let productoTest
{
  const { data: existente } = await admin.from('productos').select('id_producto').eq('codigo', SKU_TEST).maybeSingle()
  if (existente) {
    productoTest = existente
  } else {
    const { data: cat } = await admin.from('categorias').select('id_categoria').order('id_categoria', { ascending: true }).limit(1).single()
    const { data: creado, error } = await admin.from('productos').insert([{
      codigo: SKU_TEST,
      nombre: 'Producto de prueba integración',
      descripcion: 'Registro controlado para las pruebas de la Etapa 5. No usar.',
      id_categoria: cat.id_categoria,
      unidad_medida: 'Unidad',
      precio: 100,
      stock_actual: 0,
      stock_minimo: 5
    }]).select('id_producto, stock_actual').single()

    if (error) {
      registrar('0. Crear producto de prueba como administrador', false, error.message)
      procesoFallido()
    }
    productoTest = creado
  }
}

function procesoFallido() {
  console.error('No se pudo preparar el producto de prueba; se aborta la verificación.')
  process.exit(1)
}

// --- 2b. Operador no puede modificar categorías (la escritura no tiene efecto) ---
{
  const { data: cat } = await operador.from('categorias').select('id_categoria, descripcion').order('id_categoria', { ascending: true }).limit(1).single()
  await operador.from('categorias').update({ descripcion: 'intento no autorizado' }).eq('id_categoria', cat?.id_categoria)
  const { data: despues } = await operador.from('categorias').select('descripcion').eq('id_categoria', cat?.id_categoria).single()
  registrar('2b. Operador no puede modificar categorías (RLS)', cat?.descripcion === despues?.descripcion, 'la descripción no cambió')
}

// --- 3. Entrada vía RPC suma stock ---
const stockAntes = await admin.from('productos').select('stock_actual').eq('id_producto', productoTest.id_producto).single()
const entradaResp = await operador.rpc('registrar_movimiento', {
  p_id_producto: productoTest.id_producto,
  p_tipo_movimiento: 'Entrada',
  p_cantidad: 5,
  p_motivo: 'Entrada de proveedor',
  p_observacion: 'Prueba de integración Etapa 5'
})
registrar('3. La entrada vía RPC suma 5 unidades al stock', entradaResp.data?.success === true && entradaResp.data?.stock_nuevo === (stockAntes.data?.stock_actual ?? -1) + 5, JSON.stringify(entradaResp.data ?? entradaResp.error))

// --- 4. Salida mayor al stock: rechazada ---
const salidaExcesiva = await operador.rpc('registrar_movimiento', {
  p_id_producto: productoTest.id_producto,
  p_tipo_movimiento: 'Salida',
  p_cantidad: 999999,
  p_motivo: 'Entrega de pedidos',
  p_observacion: 'Prueba de rechazo por stock insuficiente'
})
registrar('4. La salida mayor al stock se rechaza (RN05)', salidaExcesiva.data?.success === false, JSON.stringify(salidaExcesiva.data ?? salidaExcesiva.error))

// --- 5. Cantidad inválida: rechazada ---
const cantidadInvalida = await operador.rpc('registrar_movimiento', {
  p_id_producto: productoTest.id_producto,
  p_tipo_movimiento: 'Entrada',
  p_cantidad: 0,
  p_motivo: 'Ajuste de inventario',
  p_observacion: null
})
registrar('5. La cantidad 0 se rechaza (RN04)', cantidadInvalida.data?.success === false, JSON.stringify(cantidadInvalida.data ?? cantidadInvalida.error))

// --- 6. Operador no puede desactivar productos ---
const desactivarOperador = await operador.rpc('desactivar_producto', { p_id_producto: productoTest.id_producto })
registrar('6. El operador no puede desactivar productos (RPC admin-only)', desactivarOperador.data?.success === false, JSON.stringify(desactivarOperador.data ?? desactivarOperador.error))

// --- 7. Admin desactiva y reactiva el producto de prueba ---
const desactivarAdmin = await admin.rpc('desactivar_producto', { p_id_producto: productoTest.id_producto })
const estadoInactivo = await admin.from('productos').select('activo').eq('id_producto', productoTest.id_producto).single()
const reactivarAdmin = await admin.rpc('activar_producto', { p_id_producto: productoTest.id_producto })
const estadoActivo = await admin.from('productos').select('activo').eq('id_producto', productoTest.id_producto).single()
registrar('7. El administrador desactiva y reactiva el producto de prueba', desactivarAdmin.data?.success === true && estadoInactivo.data?.activo === false && reactivarAdmin.data?.success === true && estadoActivo.data?.activo === true)

// --- 8. SKU duplicado: rechazado ---
{
  const { error } = await admin.from('productos').insert([{
    codigo: SKU_TEST,
    nombre: 'Duplicado controlado',
    id_categoria: 1,
    unidad_medida: 'Unidad',
    precio: 100,
    stock_actual: 0,
    stock_minimo: 0
  }])
  registrar('8. Un SKU duplicado se rechaza por unicidad (RN02)', error?.code === '23505', error?.code)
}

// --- 9. El historial conserva los movimientos con responsable ---
const { data: historial } = await admin.from('vw_movimientos_detalle')
  .select('tipo_movimiento, cantidad, usuario_nombre, producto_codigo')
  .eq('id_producto', productoTest.id_producto)
  .order('fecha_hora', { ascending: true })

const tieneEntrada = historial?.some((m) => m.tipo_movimiento === 'Entrada' && m.cantidad === 5)
const responsableCompleto = historial?.every((m) => Boolean(m.usuario_nombre))
registrar('9. El historial registra la entrada con su responsable (RN06/RF07)', Boolean(tieneEntrada && responsableCompleto), `${historial?.length ?? 0} mov. de prueba · responsable: ${historial?.[0]?.usuario_nombre ?? 's/d'}`)

// --- Resumen ---
const fallos = resultados.filter((r) => !r.ok)
console.log(`\n${resultados.length - fallos.length}/${resultados.length} comprobaciones superadas.`)
process.exit(fallos.length ? 1 : 0)
