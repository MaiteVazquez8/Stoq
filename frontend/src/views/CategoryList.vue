<template>
  <div class="pila--24">
    <PageHeader
      titulo="Categorías"
      subtitulo="Organizá el catálogo y consultá cuántos productos tiene cada categoría."
    />

    <Alert v-if="mensajeExito" tipo="exito" titulo="Operación realizada" :mensaje="mensajeExito" />
    <Alert v-if="mensajeError && !modalAbierto" tipo="error" titulo="No pudimos completar la operación" :mensaje="mensajeError" />

    <LoadingState v-if="cargando" texto="Cargando categorías…" />

    <div v-else class="categorias-grilla">
      <!-- Formulario de alta / edición -->
      <section class="panel">
        <h3 class="panel-titulo">{{ editando ? 'Editar categoría' : 'Nueva categoría' }}</h3>

        <form class="pila--16" novalidate @submit.prevent="guardar">
          <Input
            v-model="form.nombre"
            etiqueta="Nombre de la categoría"
            nombre="nombre-categoria"
            placeholder="Ej.: Velas"
            :requerido="true"
            :error="errores.nombre"
            :maxlength="60"
          />

          <Input
            v-model="form.descripcion"
            etiqueta="Descripción / Opcional"
            nombre="descripcion-categoria"
            tipo="textarea"
            :filas="3"
            placeholder="Ej.: Velas aromáticas de soja y parafina."
            :maxlength="160"
            :error="errores.descripcion"
          />

          <div class="fila acciones-pila">
            <Button tipo="submit" :cargando="guardando" :texto-cargando="editando ? 'Guardando…' : 'Creando…'">
              {{ editando ? 'Guardar cambios' : 'Crear categoría' }}
            </Button>
            <Button v-if="editando" variante="secundario" tipo="button" @click="cancelarEdicion">
              Cancelar
            </Button>
          </div>
        </form>
      </section>

      <!-- Listado de categorías -->
      <section class="panel">
        <div class="panel__cabecera">
          <h3 class="panel-titulo">Categorías registradas · {{ categorias.length }}</h3>
        </div>

        <p v-if="errorCarga" class="texto-secundario">
          No pudimos cargar las categorías.
          <button type="button" class="enlace-accion boton-enlace" @click="cargar">Reintentar</button>
        </p>

        <ul v-else-if="categorias.length" class="lista-categorias">
          <li v-for="categoria in categorias" :key="categoria.id_categoria" class="item-categoria" :class="{ 'item-categoria--inactiva': !categoria.activo }">
            <div class="item-categoria__info">
              <span class="item-categoria__nombre">
                {{ categoria.nombre }}
                <span v-if="!categoria.activo" class="etiqueta-inactivo">Inactiva</span>
              </span>
              <span class="item-categoria__meta">
                {{ cantidadDe(categoria.id_categoria) }} {{ cantidadDe(categoria.id_categoria) === 1 ? 'producto' : 'productos' }}
                <span v-if="categoria.descripcion"> · {{ categoria.descripcion }}</span>
              </span>
            </div>

            <div class="item-categoria__acciones">
              <button type="button" class="btn btn-icono" :aria-label="`Editar ${categoria.nombre}`" @click="editar(categoria)">
                <Icon nombre="lapiz" :tamano="18" />
              </button>
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="categoria.activo ? `Desactivar ${categoria.nombre}` : `Reactivar ${categoria.nombre}`"
                @click="solicitarAlternar(categoria)"
              >
                <Icon :nombre="categoria.activo ? 'equis' : 'check'" :tamano="18" />
              </button>
              <button
                type="button"
                class="btn btn-icono"
                :aria-label="`Eliminar ${categoria.nombre}`"
                @click="solicitarEliminar(categoria)"
              >
                <Icon nombre="alerta" :tamano="18" />
              </button>
            </div>
          </li>
        </ul>

        <EmptyState
          v-else
          icono="caja"
          titulo="Todavía no hay categorías"
          texto="Creá la primera categoría con el formulario."
        />
      </section>
    </div>

    <ConfirmModal
      :abierto="modalAbierto"
      :titulo="tituloModal"
      :texto-confirmar="textoConfirmarModal"
      texto-procesando="Aplicando…"
      :procesando="procesandoModal"
      @cancelar="modalAbierto = false"
      @confirmar="confirmarModal"
    >
      <p>{{ textoModal }}</p>
      <p v-if="accionModal === 'eliminar'" class="texto-secundario">Solo se puede eliminar si no tiene productos asociados.</p>
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
  createCategory,
  updateCategory,
  desactivarCategoria,
  activarCategoria,
  eliminarCategoria
} from '@/services/store'
import { getAllCategories, productosPorCategoria } from '@/services/categories'

const categorias = ref([])
const conteoProductos = ref({})
const cargando = ref(true)
const errorCarga = ref(false)

const form = reactive({ nombre: '', descripcion: '' })
const errores = reactive({})
const editando = ref(null)
const guardando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

const modalAbierto = ref(false)
const procesandoModal = ref(false)
const accionModal = ref('')
const categoriaModal = ref(null)

const cargar = async () => {
  cargando.value = true
  errorCarga.value = false

  const [categoriasResp, conteoResp] = await Promise.all([
    getAllCategories(),
    productosPorCategoria()
  ])

  if (categoriasResp.error || conteoResp.error) {
    errorCarga.value = true
  } else {
    categorias.value = categoriasResp.data ?? []
    conteoProductos.value = conteoResp.data ?? {}
  }

  cargando.value = false
}

onMounted(cargar)

const cantidadDe = (idCategoria) => conteoProductos.value[idCategoria] ?? 0

const limpiarMensajes = () => {
  mensajeExito.value = ''
  mensajeError.value = ''
}

const resetForm = () => {
  form.nombre = ''
  form.descripcion = ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
  editando.value = null
}

const editar = (categoria) => {
  limpiarMensajes()
  editando.value = categoria.id_categoria
  form.nombre = categoria.nombre
  form.descripcion = categoria.descripcion || ''
  Object.keys(errores).forEach((clave) => delete errores[clave])
}

const cancelarEdicion = () => {
  limpiarMensajes()
  resetForm()
}

const guardar = async () => {
  limpiarMensajes()
  Object.keys(errores).forEach((clave) => delete errores[clave])

  const nombre = form.nombre.trim()
  if (!nombre) {
    errores.nombre = 'Ingresá el nombre de la categoría.'
  } else if (nombre.length < 2) {
    errores.nombre = 'El nombre necesita al menos 2 caracteres.'
  }

  if (Object.keys(errores).length) {
    mensajeError.value = 'Revisá los campos marcados para continuar.'
    return
  }

  guardando.value = true
  const resultado = editando.value
    ? await updateCategory(editando.value, { nombre, descripcion: form.descripcion })
    : await createCategory({ nombre, descripcion: form.descripcion })
  guardando.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    if (resultado.campo) errores[resultado.campo] = resultado.error
    return
  }

  mensajeExito.value = editando.value
    ? `La categoría “${resultado.category.nombre}” se actualizó correctamente.`
    : `La categoría “${resultado.category.nombre}” se creó correctamente.`

  resetForm()
  await cargar()
}

// --- Modal de confirmación (alternar activo / eliminar) ---
const tituloModal = computed(() => {
  if (accionModal.value === 'eliminar') return '¿Eliminar categoría?'
  return categoriaModal.value?.activo ? '¿Desactivar categoría?' : '¿Reactivar categoría?'
})

const textoConfirmarModal = computed(() => {
  if (accionModal.value === 'eliminar') return 'Eliminar'
  return categoriaModal.value?.activo ? 'Desactivar' : 'Reactivar'
})

const textoModal = computed(() => {
  if (!categoriaModal.value) return ''
  if (accionModal.value === 'eliminar') {
    return `Vas a eliminar “${categoriaModal.value.nombre}”. Si tiene productos asociados la operación se va a rechazar.`
  }
  if (categoriaModal.value.activo) {
    return `Vas a desactivar “${categoriaModal.value.nombre}”. Esta categoría quedará oculta de los formularios.`
  }
  return `Vas a reactivar “${categoriaModal.value.nombre}”.`
})

const solicitarAlternar = (categoria) => {
  limpiarMensajes()
  accionModal.value = 'alternar'
  categoriaModal.value = categoria
  modalAbierto.value = true
}

const solicitarEliminar = (categoria) => {
  limpiarMensajes()
  accionModal.value = 'eliminar'
  categoriaModal.value = categoria
  modalAbierto.value = true
}

const confirmarModal = async () => {
  const categoria = categoriaModal.value
  if (!categoria) return

  procesandoModal.value = true

  const resultado =
    accionModal.value === 'eliminar'
      ? await eliminarCategoria(categoria.id_categoria)
      : categoria.activo
        ? await desactivarCategoria(categoria.id_categoria)
        : await activarCategoria(categoria.id_categoria)

  procesandoModal.value = false
  modalAbierto.value = false

  if (!resultado.success) {
    mensajeError.value = resultado.error
    return
  }

  mensajeExito.value =
    accionModal.value === 'eliminar'
      ? `La categoría “${categoria.nombre}” se eliminó correctamente.`
      : categoria.activo
        ? `La categoría “${categoria.nombre}” se desactivó.`
        : `La categoría “${categoria.nombre}” se reactivó.`

  await cargar()
}
</script>

<style scoped>
.categorias-grilla {
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

.lista-categorias {
  display: flex;
  flex-direction: column;
  gap: var(--esp-12);
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-categoria {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-16);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.item-categoria--inactiva { opacity: 0.6; }

.item-categoria__info {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  min-width: 0;
}

.item-categoria__nombre { font-weight: 500; }
.item-categoria__meta { color: var(--texto-secundario); font-size: 13px; }
.item-categoria__acciones { display: flex; gap: var(--esp-8); flex: 0 0 auto; }

.etiqueta-inactivo {
  display: inline-block;
  margin-left: var(--esp-8);
  padding: 2px var(--esp-8);
  border-radius: var(--radio-control);
  border: 1px solid var(--n-400);
  color: var(--texto-secundario);
  font-size: 11px;
  vertical-align: middle;
}

.boton-enlace {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 900px) {
  .categorias-grilla { grid-template-columns: minmax(0, 1fr); }
}
</style>
