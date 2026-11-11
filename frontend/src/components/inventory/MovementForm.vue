<template>
  <div class="pila--24">
    <Alert
      v-if="mensajeExito"
      tipo="exito"
      :titulo="mensajeExito.titulo"
      :mensaje="mensajeExito.texto"
    />

    <Alert
      v-if="mensajeError"
      tipo="error"
      :titulo="mensajeError.titulo"
      :mensaje="mensajeError.texto"
    />

    <LoadingState v-if="cargandoProductos" texto="Cargando productos…" />

    <form v-else class="pila--24" novalidate @submit.prevent="solicitarConfirmacion">
      <div class="selector-tipo">
        <div class="selector-tipo__opciones">
          <button
            v-for="opcion in TIPOS"
            :key="opcion.valor"
            type="button"
            class="opcion-tipo"
            :class="{ 'opcion-tipo--activa': form.tipo_movimiento === opcion.valor }"
            :aria-pressed="form.tipo_movimiento === opcion.valor ? 'true' : 'false'"
            @click="cambiarTipo(opcion.valor)"
          >
            <Icon :nombre="opcion.icono" :tamano="16" />
            {{ opcion.valor }}
          </button>
        </div>
        <p class="campo-ayuda">Entrada suma. Salida descuenta.</p>
      </div>

      <div class="grilla-dos grilla-dos--amplia">
        <Input
          v-model="form.id_producto"
          etiqueta="Producto"
          nombre="movimiento-producto"
          tipo="select"
          placeholder="Elegí un producto"
          :requerido="true"
          :opciones="opcionesProductos"
          :error="errores.id_producto"
        />

        <Input
          v-model="form.cantidad"
          etiqueta="Cantidad"
          nombre="movimiento-cantidad"
          type="text"
          inputmode="numeric"
          placeholder="Ej.: 6"
          :requerido="true"
          :ayuda="ayudaCantidad"
          :error="errores.cantidad"
        />

        <Input
          :model-value="fechaHoraCampo"
          etiqueta="Fecha y hora"
          nombre="movimiento-fecha"
          tipo="estatico"
          :ayuda="ayudaResponsable"
        />

        <Input
          v-model="form.motivo"
          etiqueta="Motivo"
          nombre="movimiento-motivo"
          tipo="select"
          placeholder="Elegí un motivo"
          :requerido="true"
          :opciones="motivosDisponibles"
          :error="errores.motivo"
        />
      </div>

      <Input
        v-model="form.observacion"
        etiqueta="Nota interna / Opcional"
        nombre="movimiento-nota"
        tipo="textarea"
        :filas="2"
        placeholder="Ej.: Retiro de pedido de la mañana."
        :maxlength="200"
      />

      <div class="panel previsualizacion">
        <p class="texto-etiqueta">Antes de confirmar</p>
        <p class="previsualizacion__linea">{{ lineaPrevia }}</p>
        <p class="texto-secundario">Vista previa. El stock todavía no se modificó.</p>
      </div>

      <p v-if="productoSeleccionado" class="nota-linea">
        <Icon nombre="info" :tamano="16" class="nota-linea__icono" />
        No se permiten salidas mayores al stock disponible. El saldo actual de
        {{ productoSeleccionado.codigo }} es {{ formatUnidades(productoSeleccionado.stock_actual) }},
        el mínimo es {{ formatUnidades(productoSeleccionado.stock_minimo) }}.
      </p>

      <p v-if="!opcionesProductos.length" class="nota-linea">
        <Icon nombre="alerta" :tamano="16" class="nota-linea__icono" />
        No hay productos activos disponibles para mover. Registá un producto nuevo o reactivá uno existente.
      </p>

      <div class="fila acciones-pila">
        <Button tipo="submit" :deshabilitado="!puedeRegistrar || !opcionesProductos.length">
          Registrar {{ etiquetaTipo }}
        </Button>
      </div>

      <div>
        <RouterLink class="enlace-volver" :to="{ name: 'movimientos' }">
          <Icon nombre="flecha-izquierda" :tamano="16" />
          Cancelar y volver al historial
        </RouterLink>
      </div>
    </form>

    <ConfirmModal
      :abierto="modalAbierto"
      :titulo="`¿Registramos esta ${etiquetaTipo}?`"
      :texto-confirmar="`Registrar ${etiquetaTipo}`"
      texto-procesando="Registrando…"
      :procesando="registrando"
      @cancelar="modalAbierto = false"
      @confirmar="registrar"
    >
      <p v-if="productoSeleccionado">Vas a {{ form.tipo_movimiento === 'Entrada' ? 'sumar' : 'descontar' }} {{ formatUnidadesLargas(form.cantidad) }} de {{ productoSeleccionado.nombre }}.</p>
      <p><strong>Stock actual: {{ formatUnidades(stockAnterior) }} → Stock resultante: {{ formatUnidades(stockResultante) }}</strong></p>
      <p class="texto-secundario">Motivo: {{ form.motivo || 'Sin motivo' }} · {{ fechaHoraTexto }}</p>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import {
  getCurrentUser,
  getMovementMotives,
  getProductosActivos,
  cargarProductos,
  isAdmin,
  isOperador,
  registrarMovimiento
} from '@/services/store'
import { validarMovimiento, hayErrores, esEnteroPositivo } from '@/utils/validation'
import { formatFechaHoraNumerica, formatUnidades, formatUnidadesLargas } from '@/utils/format'

const props = defineProps({
  productoPreseleccionado: { type: [Number, String], default: null }
})

const router = useRouter()

const TIPOS = [
  { valor: 'Entrada', icono: 'flecha-abajo' },
  { valor: 'Salida', icono: 'flecha-arriba' }
]

const form = reactive({
  tipo_movimiento: 'Entrada',
  id_producto: '',
  cantidad: '',
  motivo: '',
  observacion: ''
})

const errores = reactive({})
const modalAbierto = ref(false)
const registrando = ref(false)
const mensajeExito = ref(null)
const mensajeError = ref(null)
const cargandoProductos = ref(true)

const productos = getProductosActivos

const opcionesProductos = computed(() =>
  productos.value.map(producto => ({
    valor: producto.id_producto,
    texto: `${producto.nombre} / ${producto.codigo}`
  }))
)

const productoSeleccionado = computed(() =>
  productos.value.find(p => p.id_producto === Number(form.id_producto)) || null
)

const motivosDisponibles = computed(() => getMovementMotives(form.tipo_movimiento))

const etiquetaTipo = computed(() => (form.tipo_movimiento === 'Entrada' ? 'entrada' : 'salida'))

const ahora = () => new Date()
const fechaHoraTexto = computed(() => formatFechaHoraNumerica(ahora()))
const fechaHoraCampo = computed(() => formatFechaHoraNumerica(ahora()))

const ayudaResponsable = computed(() => {
  const usuario = getCurrentUser()
  return usuario ? `Se registra a nombre de ${usuario.nombre}.` : 'Se registra automáticamente.'
})

const ayudaCantidad = computed(() => {
  if (!productoSeleccionado.value) return 'En unidades enteras, mayor a 0.'
  const cantidad = esEnteroPositivo(form.cantidad) ? formatUnidadesLargas(form.cantidad) : 'Cantidad en unidades'
  return `${cantidad} · Disponible: ${formatUnidades(productoSeleccionado.value.stock_actual)}`
})

const stockAnterior = computed(() => productoSeleccionado.value?.stock_actual ?? 0)

const stockResultante = computed(() => {
  if (!productoSeleccionado.value) return 0
  const cantidad = Number(form.cantidad) || 0
  return form.tipo_movimiento === 'Entrada'
    ? stockAnterior.value + cantidad
    : stockAnterior.value - cantidad
})

const stockInsuficiente = computed(
  () =>
    !!productoSeleccionado.value &&
    form.tipo_movimiento === 'Salida' &&
    esEnteroPositivo(form.cantidad) &&
    Number(form.cantidad) > productoSeleccionado.value.stock_actual
)

const lineaPrevia = computed(() => {
  if (!productoSeleccionado.value || !esEnteroPositivo(form.cantidad)) {
    return `${formatUnidades(stockAnterior.value)} → 0 unidades`
  }
  if (stockInsuficiente.value) {
    return `${formatUnidades(stockAnterior.value)} · la salida supera el stock disponible`
  }
  const signo = form.tipo_movimiento === 'Entrada' ? '+' : '–'
  return `${formatUnidades(stockAnterior.value)} ${signo} ${formatUnidades(form.cantidad)} → ${formatUnidadesLargas(stockResultante.value)}`
})

const puedeRegistrar = computed(() => isAdmin.value || isOperador.value)

const limpiarMensajes = () => {
  mensajeExito.value = null
  mensajeError.value = null
}

const cambiarTipo = (tipo) => {
  if (form.tipo_movimiento === tipo) return
  form.tipo_movimiento = tipo
  form.motivo = ''
  delete errores.motivo
  limpiarMensajes()
}

watch(
  () => props.productoPreseleccionado,
  (productoId) => {
    if (productoId) form.id_producto = Number(productoId)
  },
  { immediate: true }
)

onMounted(async () => {
  cargandoProductos.value = true
  await cargarProductos()
  cargandoProductos.value = false
})

const solicitarConfirmacion = () => {
  limpiarMensajes()

  if (!puedeRegistrar.value) {
    mensajeError.value = {
      titulo: 'Operación no autorizada',
      texto: 'Tu perfil no tiene permiso para registrar movimientos.'
    }
    return
  }

  const resultado = validarMovimiento(form, productoSeleccionado.value)
  Object.keys(errores).forEach(clave => delete errores[clave])
  Object.assign(errores, resultado)

  if (hayErrores(resultado)) {
    mensajeError.value = stockInsuficiente.value
      ? {
          titulo: 'La cantidad supera el stock disponible',
          texto: `Tenés ${formatUnidadesLargas(stockAnterior.value)}. Ingresá una cantidad entre 1 y ${stockAnterior.value} para registrar la salida.`
        }
      : {
          titulo: 'No pudimos registrar el movimiento',
          texto: 'Revisá los campos marcados para continuar. No se modificó el stock.'
        }
    return
  }

  modalAbierto.value = true
}

const registrar = async () => {
  registrando.value = true

  const respuesta = await registrarMovimiento({
    id_producto: form.id_producto,
    tipo_movimiento: form.tipo_movimiento,
    cantidad: form.cantidad,
    motivo: form.motivo,
    observacion: form.observacion
  })

  registrando.value = false
  modalAbierto.value = false

  if (!respuesta.success) {
    mensajeError.value = { titulo: 'No pudimos registrar el movimiento', texto: respuesta.error || 'Intentá de nuevo.' }
    if (respuesta.campo) errores[respuesta.campo] = respuesta.error
    return
  }

  const nombreProducto = productoSeleccionado.value?.nombre || 'el producto'

  mensajeExito.value = {
    titulo: form.tipo_movimiento === 'Entrada' ? 'Entrada registrada' : 'Salida registrada',
    texto: `${formatUnidadesLargas(respuesta.cantidad)} de ${nombreProducto}. El stock ahora es ${formatUnidades(respuesta.stock_nuevo)}.`
  }

  setTimeout(() => {
    router.push({ name: 'movimientos' })
  }, 1200)
}
</script>

<style scoped>
.selector-tipo {
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
  padding: var(--esp-16);
  background-color: var(--superficie);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.selector-tipo__opciones {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--esp-12);
}

.opcion-tipo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-8);
  min-height: 48px;
  font-size: 15px;
  color: var(--texto);
  background-color: var(--superficie);
  border: var(--borde-base);
  border-radius: var(--radio-control);
  cursor: pointer;
}

.opcion-tipo:hover { border-color: var(--n-400); }

.opcion-tipo--activa {
  color: var(--n-900);
  background-color: var(--azul-50);
  border-color: var(--azul-500);
  font-weight: 500;
}

.dark .opcion-tipo--activa {
  color: #FAFAFA;
  background-color: rgba(144, 202, 249, 0.2);
  border-color: var(--azul-200);
}

.previsualizacion {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
}

.previsualizacion__linea {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .selector-tipo__opciones { grid-template-columns: minmax(0, 1fr); }
}
</style>
