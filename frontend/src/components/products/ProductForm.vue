<template>
  <form class="formulario-producto" @submit.prevent="guardarProducto">
    <div class="campos-formulario">
      <div class="campo">
        <label class="etiqueta">Nombre del producto <span class="requerido">*</span></label>
        <input
          type="text"
          v-model="form.nombre"
          placeholder="Ej. Vela de soja - Ámbar"
          class="input-campo"
          :class="{ error: errores.nombre }"
        />
        <span v-if="errores.nombre" class="error-texto">{{ errores.nombre }}</span>
      </div>

      <div class="campo">
        <label class="etiqueta">SKU <span class="requerido">*</span></label>
        <input
          type="text"
          v-model="form.codigo"
          placeholder="Ej. VEL-001"
          class="input-campo"
          :class="{ error: errores.codigo }"
        />
        <span v-if="errores.codigo" class="error-texto">{{ errores.codigo }}</span>
      </div>

      <div class="campo">
        <label class="etiqueta">Categoría <span class="requerido">*</span></label>
        <select v-model="form.id_categoria" class="select-campo" :class="{ error: errores.id_categoria }">
          <option value="">Seleccione una categoría...</option>
          <option v-for="cat in categorias" :key="cat.id_categoria" :value="cat.id_categoria">
            {{ cat.nombre }}
          </option>
        </select>
        <span v-if="errores.id_categoria" class="error-texto">{{ errores.id_categoria }}</span>
      </div>

      <div class="campo">
        <label class="etiqueta">Precio <span class="requerido">*</span></label>
        <input
          type="text"
          v-model="form.precio"
          placeholder="Ej. 4500"
          class="input-campo"
          :class="{ error: errores.precio }"
        />
        <span v-if="errores.precio" class="error-texto">{{ errores.precio }}</span>
      </div>

      <div class="campo">
        <label class="etiqueta">Cantidad inicial <span class="requerido">*</span></label>
        <input
          type="text"
          v-model="form.cantidad_inicial"
          placeholder="Ej. 84"
          class="input-campo"
          :class="{ error: errores.cantidad_inicial }"
        />
        <span v-if="errores.cantidad_inicial" class="error-texto">{{ errores.cantidad_inicial }}</span>
      </div>

      <div class="campo">
        <label class="etiqueta">Stock mínimo</label>
        <input
          type="text"
          v-model="form.stock_minimo"
          placeholder="Ej. 20"
          class="input-campo"
        />
      </div>

      <div class="campo campo-descripcion">
        <label class="etiqueta">Descripción</label>
        <textarea
          v-model="form.descripcion"
          placeholder="Descripción opcional del producto"
          class="textarea-campo"
        ></textarea>
      </div>

      <div class="campo campo-checkbox">
        <label class="etiqueta-checkbox">
          <input type="checkbox" v-model="form.alerta_stock_minimo" />
          Espera con stock mínimo
        </label>
        <span class="texto-ayuda">Si se activa, se activa una alerta cuando el stock del producto baja de este valor.</span>
      </div>
    </div>

    <div class="acciones-formulario">
      <button type="button" class="btn-cancelar" @click="$emit('cancelar')">Cancelar</button>
      <button
        type="submit"
        class="btn-guardar"
        :disabled="cargando"
      >
        {{ cargando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear producto' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { createProduct, updateProduct, getProduct } from '@/services/store'
import { categories } from '@/data/categories'

const props = defineProps({
  productoId: { type: [Number, String], default: null },
  esEditar: { type: Boolean, default: false }
})

const emit = defineEmits(['guardar', 'cancelar'])

const categorias = categories
const cargando = ref(false)

const form = reactive({
  nombre: '',
  codigo: '',
  id_categoria: '',
  precio: '',
  cantidad_inicial: '',
  stock_minimo: '',
  descripcion: '',
  alerta_stock_minimo: false
})

const errores = reactive({
  nombre: '',
  codigo: '',
  id_categoria: '',
  precio: '',
  cantidad_inicial: ''
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
    form.alerta_stock_minimo = producto.stock_minimo > 0
  }
}

const validarFormulario = () => {
  errores.nombre = ''
  errores.codigo = ''
  errores.id_categoria = ''
  errores.precio = ''
  errores.cantidad_inicial = ''

  let valido = true

  if (!form.nombre || form.nombre.trim().length < 2) {
    errores.nombre = 'Ingrese un nombre válido.'
    valido = false
  }

  if (!form.codigo || form.codigo.trim().length < 2) {
    errores.codigo = 'Ingrese un SKU válido.'
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
      cargando.value = false
      emit('guardar', resultado.product)
    } else {
      // Mostrar error en el campo correspondiente
      if (resultado.error.includes('código') || resultado.error.includes('SKU')) {
        errores.codigo = resultado.error
      } else {
        alert(resultado.error)
      }
      cargando.value = false
    }
  } catch (err) {
    alert('Error inesperado al guardar.')
    cargando.value = false
  }
}

watch(() => props.esEditar, () => {
  errores.nombre = ''
  errores.codigo = ''
  errores.id_categoria = ''
  errores.precio = ''
  errores.cantidad_inicial = ''
})
</script>

<style scoped>
.formulario-producto {
  max-width: 700px;
  margin: 0 auto;
}

.campos-formulario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--espacio-20);
  margin-bottom: var(--espacio-24);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-6);
}

.campo-descripcion {
  grid-column: 1 / -1;
}

.campo-checkbox {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: var(--espacio-8);
  padding: var(--espacio-12);
  background-color: var(--color-gris-fondo);
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-gris-borde);
}

.etiqueta {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-negro);
  display: flex;
  align-items: center;
}

.requerido {
  color: var(--color-azul-500);
  margin-left: var(--espacio-4);
}

.input-campo,
.select-campo {
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  width: 100%;
  box-sizing: border-box;
}

.input-campo:focus,
.select-campo:focus {
  outline: none;
  border-color: var(--color-azul-500);
}

.input-campo.error,
.select-campo.error {
  border-color: var(--color-error);
}

.textarea-campo {
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  resize: vertical;
}

.textarea-campo:focus {
  outline: none;
  border-color: var(--color-azul-500);
}

.etiqueta-checkbox {
  display: flex;
  align-items: center;
  gap: var(--espacio-8);
  font-size: 14px;
  color: var(--color-negro);
  cursor: pointer;
}

.texto-ayuda {
  font-size: 12px;
  color: var(--color-gris-texto);
  margin-left: var(--espacio-8);
}

.error-texto {
  font-size: 12px;
  color: var(--color-error);
  margin-top: var(--espacio-4);
}

.acciones-formulario {
  display: flex;
  gap: var(--espacio-12);
  justify-content: flex-end;
}

.btn-cancelar {
  padding: var(--espacio-12) var(--espacio-24);
  font-family: var(--fuente-principal);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-azul-900);
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  cursor: pointer;
}

.btn-cancelar:hover {
  background-color: var(--color-gris-fondo);
}

.btn-guardar {
  padding: var(--espacio-12) var(--espacio-24);
  font-family: var(--fuente-principal);
  font-size: 14px;
  font-weight: 500;
  background-color: var(--color-azul-500);
  color: var(--color-blanco);
  border: none;
  border-radius: var(--radio-borde);
  cursor: pointer;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #1976D2;
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .campos-formulario {
    grid-template-columns: 1fr;
  }

  .acciones-formulario {
    flex-direction: column;
  }

  .acciones-formulario button {
    width: 100%;
  }
}
</style>