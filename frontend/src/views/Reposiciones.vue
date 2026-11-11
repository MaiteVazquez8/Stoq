<template>
  <div class="pila--24">
    <PageHeader
      titulo="Reposiciones"
      subtitulo="Gestioná pedidos esperados de mercadería por proveedor. Solo administrador."
    />

    <Alert v-if="mensajeExito" tipo="exito" titulo="Operación realizada" :mensaje="mensajeExito" />
    <Alert v-if="mensajeError && !modalAbierto" tipo="error" titulo="No pudimos completar la operación" :mensaje="mensajeError" />

    <LoadingState v-if="cargando" texto="Cargando reposiciones…" />

    <div v-else class="reposiciones-grilla">
      <!-- Formulario de alta / edición -->
      <section class="panel">
        <h3 class="panel-titulo">{{ editando ? 'Editar reposición' : 'Nueva reposición' }}</h3>

        <form class="pila--16" novalidate @submit.prevent="guardar">
          <Input
            v-model="form.id_proveedor"
            etiqueta="Proveedor"
            nombre="proveedor-reposicion"
            tipo="select"
            placeholder="Elegí un proveedor"
            :opciones="opcionesProveedores"
            :error="errores.id_proveedor"
            :maxlength="60"
          />

          <Input
            v-model="form.fecha"
            etiqueta="Fecha"
            nombre="fecha-reposicion"
            type="date"
            :requerido="true"
            :error="errores.fecha"
          />

          <Input
            v-model="form.observacion"
            etiqueta="Observación"
            nombre="observacion-reposicion"
            tipo="textarea"
            :filas="2"
            placeholder="Ej.: Pedido programado de vela ámbar."
            :maxlength="200"
            :error="errores.observacion"
          />

          <div class="fila acciones-pila">
            <Button tipo="submit" :cargando="guardando" :texto-cargando="editando ? 'Guardando…' : 'Creando…'">
              {{ editando ? 'Guardar cambios' : 'Crear reposición' }}
            </Button>
            <Button v-if="editando" variante="secundario" tipo="button" @click="cancelarEdicion">
              Cancelar
            </Button>
          </div>
        </form>
      </section>

      <!-- Listado de reposiciones -->
      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Reposiciones registradas · {{ reposiciones.length }}</h3>
        </div>

        <p v-if="errorCarga" class="texto-secundario">
          No pudimos cargar las reposiciones.
          <button type="button" class="enlace-accion boton-enlace" @click="cargar">Reintentar</button>
        </p>

        <ul v-else-if="reposiciones.length" class="lista-reposiciones">
          <li
            v-for="reposicion in reposiciones"
            :key="reposicion.id_reposicion"
            class="item-reposicion"
            :class="{ 'item-reposicion--recibida': reposicion.estado === 'recibida' }"
          >
            <div class="item-reposicion__info">
              <div class="item-reposicion__cabecera">
                <span class="item-reposicion__proveedor">
                  {{ reposicion.proveedor_nombre || 'Sin proveedor asignado' }}
                </span>
                <span class="etiqueta-estado" :class="reposicion.estado === 'recibida' ? 'etiqueta-estado--recibida' : 'etiqueta-estado--pendiente'">
                  {{ reposicion.estado === 'recibida' ? 'Recibida' : 'Pendiente' }}
                </span>
              </div>
              <span class="item-reposicion__meta">
                {{ formatFechaConMes(reposicion.fecha) }} ·
                {{ reposicion.total_productos || 0 }} {{ reposicion.total_productos === 1 ? 'producto' : 'productos' }} ·
                {{ reposicion.total_unidades || 0 }} u.
              </span>
              <span v-if="reposicion.observacion" class="item-reposicion__meta">{{ reposicion.observacion }}</span>
            </div>

            <div class="item-reposicion__acciones">
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="`Ver detalle de ${reposicion.proveedor_nombre || 'reposición'}`"
                @click="verDetalle(reposicion)"
              >
                <Icon nombre="ojo" :tamano="18" />
              </button>
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="`Editar ${reposicion.proveedor_nombre || 'reposición'}`"
                :disabled="reposicion.estado === 'recibida'"
                @click="editar(reposicion)"
              >
                <Icon nombre="lapiz" :tamano="18" />
              </button>
              <button
                v-if="reposicion.estado === 'pendiente'"
                type="button"
                class="btn btn-icono"
                :aria-label="`Marcar como recibida`"
                @click="solicitarRecibir(reposicion)"
              >
                <Icon nombre="check" :tamano="18" />
              </button>
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="`Eliminar reposición`"
                :disabled="reposicion.estado === 'recibida'"
                @click="solicitarEliminar(reposicion)"
              >
                <Icon nombre="alerta" :tamano="18" />
              </button>
            </div>
          </li>
        </ul>

        <EmptyState
          v-else
          icono="caja"
          titulo="Todavía no hay reposiciones"
          texto="Creá la primera reposición con el formulario."
        />
      </section>
    </div>

    <!-- Detalle de una reposición -->
    <section v-if="detalle" class="panel detalle-reposicion">
      <div class="panel__cabecera fila fila--separada">
        <div>
          <h3 class="panel-titulo">
            Detalle · {{ proveedorDetalle || 'Sin proveedor' }} · {{ formatFechaConMes(detalle.fecha) }}
          </h3>
          <p class="texto-secundario">
            Estado: {{ detalle.estado === 'recibida' ? 'Recibida' : 'Pendiente' }} ·
            {{ detalle.reposicion_productos?.length || 0 }} {{ detalle.reposicion_productos?.length === 1 ? 'línea' : 'líneas' }}
          </p>
        </div>
        <button type="button" class="enlace-accion boton-enlace" @click="cerrarDetalle">Cerrar detalle</button>
      </div>

      <div v-if="detalle.estado !== 'recibida'" class="agregar-linea">
        <Input
          v-model="nuevaLinea.id_producto"
          etiqueta="Producto"
          nombre="producto-reposicion"
          tipo="select"
          placeholder="Elegí un producto"
          :opciones="opcionesProductos"
        />
        <Input
          v-model="nuevaLinea.cantidad"
          etiqueta="Cantidad"
          nombre="cantidad-reposicion"
          type="text"
          inputmode="numeric"
          placeholder="Ej.: 40"
          :error="errorLinea"
        />
        <Button tipo="button" :deshabilitado="!puedeAgregarLinea" @click="agregarLinea">
          Agregar línea
        </Button>
      </div>

      <p v-if="mensajeErrorDetalle" class="texto-secundario detalle-error">{{ mensajeErrorDetalle }}</p>

      <ul v-if="detalle.reposicion_productos?.length" class="lista-lineas">
        <li v-for="linea in detalle.reposicion_productos" :key="linea.productos.id_producto" class="item-linea">
          <div class="item-linea__info">
            <span class="item-linea__nombre">{{ linea.productos.nombre }}</span>
            <span class="item-linea__meta">{{ linea.productos.codigo }} · Stock actual: {{ formatUnidades(linea.productos.stock_actual) }}</span>
          </div>
          <div class="item-linea__acciones">
            <span class="item-linea__cantidad">{{ formatUnidades(linea.cantidad) }}</span>
            <button
              v-if="detalle.estado !== 'recibida'"
              type="button"
              class="btn btn-icono"
              :aria-label="`Quitar ${linea.productos.nombre}`"
              @click="quitarLinea(linea.productos.id_producto)"
            >
              <Icon nombre="equis" :tamano="18" />
            </button>
          </div>
        </li>
      </ul>

      <p v-else class="texto-secundario">Todavía no hay productos en esta reposición.</p>

      <div v-if="detalle.estado === 'pendiente'" class="fila acciones-pila">
        <Button variante="secundario" tipo="button" @click="marcarRecibidaDetalle">
          <Icon nombre="check" :tamano="16" />
          Marcar como recibida
        </Button>
      </div>
    </section>

    <ConfirmModal
      :abierto="modalAbierto"
      :titulo="tituloModal"
      :texto-confirmar="textoConfirmarModal"
      :texto-procesando="textoProcesandoModal"
      :procesando="procesandoModal"
      @cancelar="modalAbierto = false"
      @confirmar="confirmarModal"
    >
      <p>{{ textoModal }}</p>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  getReposiciones,
  getReposicionConDetalle,
  createReposicion,
  updateReposicion,
  eliminarReposicion,
  marcarRecibida,
  agregarLinea as agregarLineaSVC,
  quitarLinea as quitarLineaSVC
} from '@/services/reposiciones'
import { getProveedores } from '@/services/proveedores'
import { getProductosActivos, cargarProductos } from '@/services/store'
import { formatFechaConMes, formatUnidades } from '@/utils/format'

const reposiciones = ref([])
const proveedores = ref([])
const cargando = ref(true)
const errorCarga = ref(false)

const form = reactive({
  id_proveedor: '',
  fecha: new Date().toISOString().slice(0, 10),
  observacion: ''
})
const errores = reactive({})
const editando = ref(null)
const guardando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

const modalAbierto = ref(false)
const procesandoModal = ref(false)
const accionModal = ref('')
const reposicionModal = ref(null)

const detalle = ref(null)
const mensajeErrorDetalle = ref('')
const nuevaLinea = reactive({ id_producto: '', cantidad: '' })
const errorLinea = ref('')

const cargar = async () => {
  cargando.value = true
  errorCarga.value = false

  const [reposicionesResp, proveedoresResp] = await Promise.all([
    getReposiciones(),
    getProveedores(),
    cargarProductos()
  ])

  if (reposicionesResp.error || proveedoresResp.error) {
    errorCarga.value = true
  } else {
    reposiciones.value = reposicionesResp.data ?? []
    proveedores.value = proveedoresResp.data ?? []
  }

  cargando.value = false
}

onMounted(cargar)

const opcionesProveedores = computed(() => [
  { valor: '', texto: 'Sin proveedor asignado' },
  ...proveedores.value.map((p) => ({ valor: p.id_proveedor, texto: p.nombre_razon_social }))
])

const opcionesProductos = computed(() =>
  getProductosActivos.value.map((p) => ({
    valor: p.id_producto,
    texto: `${p.nombre} / ${p.codigo}`
  }))
)

const proveedorDetalle = computed(() => detalle.value?.proveedores?.nombre_razon_social || null)

const puedeAgregarLinea = computed(() =>
  Boolean(nuevaLinea.id_producto) && /^\d+$/.test(String(nuevaLinea.cantidad).trim()) && Number(nuevaLinea.cantidad) > 0
)

const limpiarMensajes = () => {
  mensajeExito.value = ''
  mensajeError.value = ''
}

const resetForm = () => {
  form.id_proveedor = ''
  form.fecha = new Date().toISOString().slice(0, 10)
  form.observacion = ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
  editando.value = null
}

const editar = (reposicion) => {
  limpiarMensajes()
  editando.value = reposicion.id_reposicion
  form.id_proveedor = reposicion.id_proveedor ?? ''
  form.fecha = String(reposicion.fecha).slice(0, 10)
  form.observacion = reposicion.observacion || ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
}

const cancelarEdicion = () => {
  limpiarMensajes()
  resetForm()
}

const validar = () => {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  const erroresNuevos = {}

  if (!form.fecha) {
    erroresNuevos.fecha = 'Ingresá una fecha.'
  }

  Object.assign(errores, erroresNuevos)
  return Object.keys(erroresNuevos).length === 0
}

const guardar = async () => {
  limpiarMensajes()

  if (!validar()) {
    mensajeError.value = 'Revisá los campos marcados para continuar.'
    return
  }

  guardando.value = true

  const datos = {
    id_proveedor: form.id_proveedor || null,
    fecha: form.fecha,
    observacion: form.observacion
  }

  const resultado = editando.value
    ? await updateReposicion(editando.value, datos)
    : await createReposicion(datos)

  guardando.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    return
  }

  mensajeExito.value = editando.value
    ? 'La reposición se actualizó correctamente.'
    : 'La reposición se creó correctamente.'

  resetForm()
  await cargar()
}

const verDetalle = async (reposicion) => {
  mensajeErrorDetalle.value = ''
  mensajeError.value = ''
  const detalleResp = await getReposicionConDetalle(reposicion.id_reposicion)

  if (detalleResp.error) {
    mensajeErrorDetalle.value = 'No se pudo cargar el detalle de la reposición.'
    return
  }

  detalle.value = detalleResp.data
}

const cerrarDetalle = () => {
  detalle.value = null
  nuevaLinea.id_producto = ''
  nuevaLinea.cantidad = ''
  errorLinea.value = ''
}

const agregarLinea = async () => {
  errorLinea.value = ''
  mensajeErrorDetalle.value = ''

  if (!puedeAgregarLinea.value) {
    errorLinea.value = 'Elegí un producto y una cantidad entera mayor a 0.'
    return
  }

  const resultado = await agregarLineaSVC(detalle.value.id_reposicion, Number(nuevaLinea.id_producto), Number(nuevaLinea.cantidad))

  if (!resultado.success) {
    mensajeErrorDetalle.value = resultado.error
    return
  }

  nuevaLinea.id_producto = ''
  nuevaLinea.cantidad = ''
  const detalleResp = await getReposicionConDetalle(detalle.value.id_reposicion)
  if (!detalleResp.error) {
    detalle.value = detalleResp.data
  }
  await cargar()
}

const quitarLinea = async (idProducto) => {
  mensajeErrorDetalle.value = ''
  const resultado = await quitarLineaSVC(detalle.value.id_reposicion, idProducto)

  if (!resultado.success) {
    mensajeErrorDetalle.value = resultado.error
    return
  }

  const detalleResp = await getReposicionConDetalle(detalle.value.id_reposicion)
  if (!detalleResp.error) {
    detalle.value = detalleResp.data
  }
  await cargar()
}

// --- Modal de confirmación ---
const tituloModal = computed(() => {
  if (!reposicionModal.value) return ''
  if (accionModal.value === 'eliminar') return '¿Eliminar reposición?'
  return '¿Marcar como recibida?'
})

const textoConfirmarModal = computed(() => {
  if (accionModal.value === 'eliminar') return 'Eliminar'
  return 'Marcar recibida'
})

const textoProcesandoModal = computed(() => accionModal.value === 'eliminar' ? 'Eliminando…' : 'Aplicando…')

const textoModal = computed(() => {
  if (!reposicionModal.value) return ''
  if (accionModal.value === 'eliminar') {
    return 'Vas a eliminar esta reposición en estado pendiente y todas sus líneas de productos. Esta acción no se puede deshacer.'
  }
  return 'Cuando marcás la reposición como recibida no se puede editar ni eliminar.'
})

const solicitarEliminar = (reposicion) => {
  limpiarMensajes()
  accionModal.value = 'eliminar'
  reposicionModal.value = reposicion
  modalAbierto.value = true
}

const solicitarRecibir = (reposicion) => {
  limpiarMensajes()
  accionModal.value = 'recibir'
  reposicionModal.value = reposicion
  modalAbierto.value = true
}

const confirmarModal = async () => {
  const reposicion = reposicionModal.value
  if (!reposicion) return

  procesandoModal.value = true

  const resultado = accionModal.value === 'eliminar'
    ? await eliminarReposicion(reposicion.id_reposicion)
    : await marcarRecibida(reposicion.id_reposicion)

  procesandoModal.value = false
  modalAbierto.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    return
  }

  mensajeExito.value = accionModal.value === 'eliminar'
    ? 'La reposición se eliminó correctamente.'
    : 'La reposición se marcó como recibida.'

  await cargar()
  if (detalle.value?.id_reposicion === reposicion.id_reposicion) {
    const detalleResp = await getReposicionConDetalle(reposicion.id_reposicion)
    if (!detalleResp.error) {
      detalle.value = detalleResp.data
    }
  }
}

const marcarRecibidaDetalle = () => {
  if (detalle.value) {
    solicitarRecibir({ id_reposicion: detalle.value.id_reposicion })
  }
}
</script>

<style scoped>
.reposiciones-grilla {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--esp-24);
  align-items: start;
}

.pila--16 {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
}

.lista-reposiciones {
  display: flex;
  flex-direction: column;
  gap: var(--esp-12);
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-reposicion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-16);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.item-reposicion--recibida { opacity: 0.75; }

.item-reposicion__info {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  min-width: 0;
}

.item-reposicion__cabecera {
  display: flex;
  align-items: center;
  gap: var(--esp-8);
  flex-wrap: wrap;
}

.item-reposicion__proveedor { font-weight: 500; }
.item-reposicion__meta { color: var(--texto-secundario); font-size: 13px; }
.item-reposicion__acciones { display: flex; gap: var(--esp-8); flex: 0 0 auto; }
.item-reposicion__acciones .btn[disabled] { opacity: 0.4; cursor: not-allowed; }

.etiqueta-estado {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--esp-8);
  border-radius: var(--radio-control);
  font-size: 11px;
  border: 1px solid var(--n-400);
  color: var(--texto-secundario);
}

.etiqueta-estado--pendiente { color: var(--texto); border-color: var(--borde); }
.etiqueta-estado--recibida { color: var(--texto-secundario); opacity: 0.85; }

.detalle-reposicion { margin-top: 0; }

.agregar-linea {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  gap: var(--esp-16);
  align-items: end;
  margin: var(--esp-16) 0;
}

.lista-lineas {
  list-style: none;
  padding: 0;
  margin: var(--esp-16) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
}

.item-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-12) var(--esp-16);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.item-linea__info { display: flex; flex-direction: column; gap: var(--esp-4); min-width: 0; }
.item-linea__nombre { font-weight: 500; }
.item-linea__meta { color: var(--texto-secundario); font-size: 13px; }
.item-linea__acciones { display: flex; align-items: center; gap: var(--esp-16); }
.item-linea__cantidad { font-weight: 600; font-variant-numeric: tabular-nums; }

.detalle-error { color: #B91C1C; }

.fila--separada { justify-content: space-between; }

.boton-enlace {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 900px) {
  .reposiciones-grilla { grid-template-columns: minmax(0, 1fr); }
  .agregar-linea { grid-template-columns: minmax(0, 1fr); }
}
</style>
