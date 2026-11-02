<template>
  <div class="formulario-producto">
    <div class="form-header">
      <h1 class="titulo-formulario">{{ esEditar ? 'Editar producto' : 'Nuevo producto' }}</h1>
      <p class="subtitulo-formulario">
        {{ esEditar ? 'Modifica los datos del producto.' : 'Completa los datos para registrar un nuevo producto.' }}
      </p>
    </div>

    <Alert v-if="alertaExito" tipo="exito" mensaje="Producto guardado correctamente." />
    <Alert v-if="alertaError" tipo="error" :mensaje="alertaError" />

    <form class="formulario" @submit.prevent="guardarProducto">
      <div class="form-grid">
        <CampoFormulario
          etiqueta="Nombre del producto *"
          id="nombre"
          tipo="input"
          v-model:valor="form.nombre"
          placeholder="Ej. Mouse inalámbrico"
          requerido
          :error="errores.nombre"
        />
        <CampoFormulario
          etiqueta="Código *"
          id="codigo"
          tipo="input"
          v-model:valor="form.codigo"
          placeholder="Ej. VEL-001"
          requerido
          :error="errores.codigo"
          textoAyuda="Código único del producto."
        />
        <CampoFormulario
          etiqueta="Categoría *"
          id="categoria"
          tipo="select"
          v-model:valor="form.id_categoria"
          requerido
          :error="errores.id_categoria"
        >
          <option v-for="cat in categorias" :key="cat.id_categoria" :value="cat.id_categoria">
            {{ cat.nombre }}
          </option>
        </CampoFormulario>
        <CampoFormulario
          etiqueta="Precio *"
          id="precio"
          tipo="input"
          v-model:valor="form.precio"
          placeholder="Ej. 25000"
          requerido
          :error="errores.precio"
          textoAyuda="Ingrese solo números."
        />
        <CampoFormulario
          etiqueta="Cantidad inicial *"
          id="cantidad_inicial"
          tipo="input"
          v-model:valor="form.cantidad_inicial"
          placeholder="Ej. 10"
          requerido
          :error="errores.cantidad_inicial"
          textoAyuda="Stock inicial del producto."
        />
        <CampoFormulario
          etiqueta="Stock mínimo"
          id="stock_minimo"
          tipo="input"
          v-model:valor="form.stock_minimo"
          placeholder="Ej. 5"
          textoAyuda="Nivel a partir del cual se muestra alerta de stock bajo."
        />
        <CampoFormulario
          etiqueta="Descripción"
          id="descripcion"
          tipo="textarea"
          v-model:valor="form.descripcion"
          placeholder="Descripción opcional del producto"
          textoAyuda="Campo opcional."
        />
      </div>

      <div class="form-acciones">
        <button class="btn btn-secundario" type="button" @click="$emit('cancelar')">Cancelar</button>
        <button
          class="btn btn-principal"
          type="submit"
          :disabled="cargando"
        >
          {{ cargando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear producto' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { createProduct, updateProduct, getProduct } from '@/services/store'
import { categories } from '@/data/categories'
import CampoFormulario from '@/components/common/Input.vue'
import Alert from '@/components/common/Alert.vue'

const props = defineProps({
  productoId: { type: [Number, String], default: null },
  esEditar: { type: Boolean, default: false }
})

const emit = defineEmits(['guardar', 'cancelar'])

const categorias = categories
const cargando = ref(false)
const alertaExito = ref(false)
const alertaError = ref('')
const errores = reactive({})

const form = reactive({
  nombre: '',
  codigo: '',
  id_categoria: '',
  precio: '',
  cantidad_inicial: '',
  stock_minimo: '',
  descripcion: ''
})

// Cargar producto si es edición
if (props.esEditar && props.productoId) {
  const producto = getProduct(Number(props.productoId))
  if (producto) {
    form.nombre = producto.nombre
    form.codigo = producto.codigo
    form.id_categoria = String(producto.id_categoria)
    form.precio = String(producto.precio)
    form.cantidad_inicial = String(producto.stock_actual)
    form.stock_minimo = String(producto.stock_minimo || '')
    form.descripcion = producto.descripcion
  }
}

const validarFormulario = () => {
  errores.nombre = ''
  errores.codigo = ''
  errores.id_categoria = ''
  errores.precio = ''
  errores.cantidad_inicial = ''
  errores.id_categoria = ''

  let valido = true

  if (!form.nombre || form.nombre.trim().length < 2) {
    errores.nombre = 'Ingrese un nombre válido.'
    valido = false
  }

  if (!form.codigo || form.codigo.trim().length < 2) {
    errores.codigo = 'Ingrese un código válido.'
    valido = false
  }

  if (!form.id_categoria) {
    errores.id_categoria = 'Seleccione una categoría.'
    valido = false
  }

  const precioNum = Number(form.precio)
  if (!form.precio || isNaN(precioNum) || precioNum <= 0) {
    errores.precio = 'Ingrese un precio válido mayor a 0.'
    valido = false
  }

  const cantNum = Number(form.cantidad_inicial)
  if (!form.cantidad_inicial || !Number.isInteger(cantNum) || cantNum < 0) {
    errores.cantidad_inicial = 'Ingrese una cantidad válida (número entero positivo).'
    valido = false
  }

  if (form.stock_minimo && (!Number.isInteger(Number(form.stock_minimo)) || Number(form.stock_minimo) < 0)) {
    errores.stock_minimo = 'Ingrese un stock mínimo válido.'
    valido = false
  }

  return valido
}

const guardarProducto = async () => {
  if (!validarFormulario()) return

  cargando.value = true
  alertaError.value = ''
  alertaExito.value = false

  const productoData = {
    nombre: form.nombre.trim(),
    codigo: form.codigo.trim().toUpperCase(),
    id_categoria: Number(form.id_categoria),
    precio: Number(form.precio),
    cantidad_inicial: Number(form.cantidad_inicial),
    stock_minimo: form.stock_minimo ? Number(form.stock_minimo) : 0,
    descripcion: form.descripcion.trim()
  }

  try {
    let resultado
    if (props.esEditar) {
      resultado = await updateProduct(Number(props.productoId), productoData)
    } else {
      resultado = await createProduct(productoData)
    }

    if (resultado.success) {
      alertaExito.value = true
      cargando.value = false
      setTimeout(() => {
        emit('guardar', resultado.product)
      }, 800)
    } else {
      alertaError.value = resultado.error || 'Error al guardar el producto.'
      cargando.value = false
    }
  } catch (err) {
    alertaError.value = 'Error inesperado al guardar.'
    cargando.value = false
  }
}

watch(() => props.esEditar, () => {
  alertaExito.value = false
  alertaError.value = ''
})
</script>

<style scoped>
.formulario-producto {
  max-width: 700px;
  margin: 0 auto;
}

.form-header {
  margin-bottom: var(--espacio-24);
}

.titulo-formulario {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-azul-900);
  margin-bottom: var(--espacio-8);
}

.subtitulo-formulario {
  font-size: 14px;
  color: var(--color-gris-oscuro);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--espacio-20);
  margin-bottom: var(--espacio-24);
}

.form-acciones {
  display: flex;
  gap: var(--espacio-12);
  justify-content: flex-end;
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-acciones {
    flex-direction: column;
  }

  .form-acciones .btn {
    width: 100%;
  }
}
</style>