<template>
  <div class="pila--24">
    <PageHeader
      titulo="Proveedores"
      subtitulo="Administrá proveedores de la cadena de suministro. Solo administrador."
    />

    <Alert v-if="mensajeExito" tipo="exito" titulo="Operación realizada" :mensaje="mensajeExito" />
    <Alert v-if="mensajeError && !modalAbierto" tipo="error" titulo="No pudimos completar la operación" :mensaje="mensajeError" />

    <LoadingState v-if="cargando" texto="Cargando proveedores…" />

    <div v-else class="proveedores-grilla">
      <!-- Formulario de alta / edición -->
      <section class="panel">
        <h3 class="panel-titulo">{{ editando ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>

        <form class="pila--16" novalidate @submit.prevent="guardar">
          <Input
            v-model="form.nombre_razon_social"
            etiqueta="Nombre o razón social"
            nombre="nombre-proveedor"
            placeholder="Ej.: Aroma del Valle S.A."
            :requerido="true"
            :error="errores.nombre_razon_social"
            :maxlength="120"
          />

          <div class="grilla-dos">
            <Input
              v-model="form.telefono"
              etiqueta="Teléfono"
              nombre="telefono-proveedor"
              placeholder="Ej.: +54 9 11 5555-0000"
              :maxlength="40"
              :error="errores.telefono"
            />

            <Input
              v-model="form.email"
              etiqueta="Correo electrónico"
              nombre="email-proveedor"
              type="email"
              placeholder="Ej.: ventas@aromadelvalle.com"
              :maxlength="80"
              :error="errores.email"
            />
          </div>

          <Input
            v-model="form.direccion"
            etiqueta="Dirección"
            nombre="direccion-proveedor"
            placeholder="Ej.: Av. San Martín 1234, CABA"
            :maxlength="120"
            :error="errores.direccion"
          />

          <Input
            v-model="form.observaciones"
            etiqueta="Observaciones"
            nombre="observaciones-proveedor"
            tipo="textarea"
            :filas="3"
            placeholder="Datos adicionales, condiciones de compra, etc."
            :maxlength="240"
            :error="errores.observaciones"
          />

          <div class="fila acciones-pila">
            <Button tipo="submit" :cargando="guardando" :texto-cargando="editando ? 'Guardando…' : 'Creando…'">
              {{ editando ? 'Guardar cambios' : 'Crear proveedor' }}
            </Button>
            <Button v-if="editando" variante="secundario" tipo="button" @click="cancelarEdicion">
              Cancelar
            </Button>
          </div>
        </form>
      </section>

      <!-- Listado de proveedores -->
      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Proveedores registrados · {{ proveedores.length }}</h3>
        </div>

        <p v-if="errorCarga" class="texto-secundario">
          No pudimos cargar los proveedores.
          <button type="button" class="enlace-accion boton-enlace" @click="cargar">Reintentar</button>
        </p>

        <ul v-else-if="proveedores.length" class="lista-proveedores">
          <li v-for="proveedor in proveedores" :key="proveedor.id_proveedor" class="item-proveedor">
            <div class="item-proveedor__info">
              <span class="item-proveedor__nombre">{{ proveedor.nombre_razon_social }}</span>
              <span class="item-proveedor__meta">
                {{ proveedor.telefono || 'Sin teléfono' }}
                <span v-if="proveedor.email"> · {{ proveedor.email }}</span>
              </span>
              <span v-if="proveedor.direccion" class="item-proveedor__meta">{{ proveedor.direccion }}</span>
              <span v-if="proveedor.observaciones" class="item-proveedor__meta">{{ proveedor.observaciones }}</span>
            </div>

            <div class="item-proveedor__acciones">
              <button type="button" class="btn btn-icono" :aria-label="`Editar ${proveedor.nombre_razon_social}`" @click="editar(proveedor)">
                <Icon nombre="lapiz" :tamano="18" />
              </button>
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="`Eliminar ${proveedor.nombre_razon_social}`"
                @click="solicitarEliminar(proveedor)"
              >
                <Icon nombre="alerta" :tamano="18" />
              </button>
            </div>
          </li>
        </ul>

        <EmptyState
          v-else
          icono="caja"
          titulo="Todavía no hay proveedores"
          texto="Creá el primer proveedor con el formulario."
        />
      </section>
    </div>

    <ConfirmModal
      :abierto="modalAbierto"
      titulo="¿Eliminar proveedor?"
      texto-confirmar="Eliminar"
      texto-procesando="Eliminando…"
      :procesando="procesandoModal"
      @cancelar="modalAbierto = false"
      @confirmar="confirmarEliminar"
    >
      <p>Vas a eliminar “{{ proveedorModal?.nombre_razon_social }}”. Se rechazará si tiene reposiciones asociadas.</p>
      <p class="texto-secundario">Los datos de contacto se conservan únicamente en las reposiciones históricas que este proveedor ya tenga.</p>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { getProveedores, createProveedor, updateProveedor, eliminarProveedor } from '@/services/proveedores'

const proveedores = ref([])
const cargando = ref(true)
const errorCarga = ref(false)

const form = reactive({
  nombre_razon_social: '',
  telefono: '',
  email: '',
  direccion: '',
  observaciones: ''
})
const errores = reactive({})
const editando = ref(null)
const guardando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

const modalAbierto = ref(false)
const procesandoModal = ref(false)
const proveedorModal = ref(null)

const cargar = async () => {
  cargando.value = true
  errorCarga.value = false

  const { data, error } = await getProveedores()

  if (error) {
    errorCarga.value = true
  } else {
    proveedores.value = data ?? []
  }

  cargando.value = false
}

onMounted(cargar)

const limpiarMensajes = () => {
  mensajeExito.value = ''
  mensajeError.value = ''
}

const resetForm = () => {
  form.nombre_razon_social = ''
  form.telefono = ''
  form.email = ''
  form.direccion = ''
  form.observaciones = ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
  editando.value = null
}

const editar = (proveedor) => {
  limpiarMensajes()
  editando.value = proveedor.id_proveedor
  form.nombre_razon_social = proveedor.nombre_razon_social || ''
  form.telefono = proveedor.telefono || ''
  form.email = proveedor.email || ''
  form.direccion = proveedor.direccion || ''
  form.observaciones = proveedor.observaciones || ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
}

const cancelarEdicion = () => {
  limpiarMensajes()
  resetForm()
}

const validar = () => {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  const erroresNuevos = {}

  const nombre = form.nombre_razon_social.trim()
  if (!nombre) {
    erroresNuevos.nombre_razon_social = 'Ingresá el nombre o razón social.'
  } else if (nombre.length < 2) {
    erroresNuevos.nombre_razon_social = 'El nombre necesita al menos 2 caracteres.'
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    erroresNuevos.email = 'Revisá el formato del correo. Ej.: ventas@aromadelvalle.com'
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

  const nombre = form.nombre_razon_social.trim()
  const datos = {
    nombre_razon_social: nombre,
    telefono: form.telefono,
    email: form.email,
    direccion: form.direccion,
    observaciones: form.observaciones
  }

  const resultado = editando.value
    ? await updateProveedor(editando.value, datos)
    : await createProveedor(datos)

  guardando.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    if (resultado.campo) errores[resultado.campo] = resultado.error
    return
  }

  mensajeExito.value = editando.value
    ? `El proveedor “${resultado.proveedor.nombre_razon_social}” se actualizó correctamente.`
    : `El proveedor “${resultado.proveedor.nombre_razon_social}” se creó correctamente.`

  resetForm()
  await cargar()
}

const solicitarEliminar = (proveedor) => {
  limpiarMensajes()
  proveedorModal.value = proveedor
  modalAbierto.value = true
}

const confirmarEliminar = async () => {
  const proveedor = proveedorModal.value
  if (!proveedor) return

  procesandoModal.value = true
  const resultado = await eliminarProveedor(proveedor.id_proveedor)
  procesandoModal.value = false
  modalAbierto.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    return
  }

  mensajeExito.value = `El proveedor “${proveedor.nombre_razon_social}” se eliminó correctamente.`
  await cargar()
}
</script>

<style scoped>
.proveedores-grilla {
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

.grilla-dos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--esp-16);
}

.lista-proveedores {
  display: flex;
  flex-direction: column;
  gap: var(--esp-12);
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-proveedor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-16);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.item-proveedor__info {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  min-width: 0;
}

.item-proveedor__nombre { font-weight: 500; }
.item-proveedor__meta { color: var(--texto-secundario); font-size: 13px; }
.item-proveedor__acciones { display: flex; gap: var(--esp-8); flex: 0 0 auto; }

.boton-enlace {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 900px) {
  .proveedores-grilla { grid-template-columns: minmax(0, 1fr); }
  .grilla-dos { grid-template-columns: minmax(0, 1fr); }
}
</style>
