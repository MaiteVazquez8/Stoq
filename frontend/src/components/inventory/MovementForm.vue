<template>
  <div class="formulario-movimiento">
    <div class="form-header">
      <h1 class="titulo-formulario">Registrar movimiento</h1>
      <p class="subtitulo-formulario">
        Registre una entrada o salida de stock para un producto.
      </p>
    </div>

    <Alert v-if="alertaExito" tipo="exito" :mensaje="mensajeExito" />
    <Alert v-if="alertaError" tipo="error" :mensaje="alertaError" />
    <Alert v-if="alertaInfo" tipo="info" :mensaje="alertaInfo" />

    <form class="formulario" @submit.prevent="registrarMovimiento">
      <div class="form-grid">
        <CampoFormulario
          etiqueta="Tipo de movimiento *"
          id="tipo_movimiento"
          tipo="select"
          v-model:valor="form.tipo_movimiento"
          requerido
          :error="errores.tipo_movimiento"
        >
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Producto *"
          id="id_producto"
          tipo="select"
          v-model:valor="form.id_producto"
          requerido
          :error="errores.id_producto"
        >
          <option value="">Seleccione un producto...</option>
          <option
            v-for="p in productosDisponibles"
            :key="p.id_producto"
            :value="p.id_producto"
          >
            {{ p.nombre }} ({{ p.codigo }}) - Stock: {{ p.stock_actual }}
          </option>
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Cantidad *"
          id="cantidad"
          tipo="input"
          v-model:valor="form.cantidad"
          placeholder="Ej. 10"
          requerido
          :error="errores.cantidad"
          textoAyuda="Debe ser un número entero positivo."
        />

        <CampoFormulario
          etiqueta="Observación"
          id="observacion"
          tipo="textarea"
          v-model:valor="form.observacion"
          placeholder="Observación opcional"
          textoAyuda="Ej. Venta a cliente, reposición, etc."
        />
      </div>

      <div class="resumen-movimiento" v-if="productoSeleccionado">
        <div class="resumen-item">
          <span class="resumen-label">Producto:</span>
          <span class="resumen-valor">{{ productoSeleccionado.nombre }}</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Stock actual:</span>
          <span class="resumen-valor">{{ productoSeleccionado.stock_actual }} unidad(es)</span>
        </div>
        <div class="resumen-item" v-if="form.tipo_movimiento === 'Salida' && productoSeleccionado">
          <span class="resumen-label">Stock después de la salida:</span>
          <span class="resumen-valor">
            {{ calcularNuevoStock() }} unidad(es)
          </span>
        </div>
      </div>

      <div class="form-acciones">
        <button class="btn btn-secundario" type="button" @click="$emit('cancelar')">Cancelar</button>
        <button
          class="btn btn-principal"
          type="submit"
          :disabled="cargando"
        >
          {{ cargando ? 'Registrando...' : 'Registrar movimiento' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { registerMovement, getProducts, getCurrentUser } from '@/services/store'
import { getCurrentUser as getAuthUser } from '@/services/store'
import CampoFormulario from '@/components/common/Input.vue'
import Alert from '@/components/common/Alert.vue'

const props = defineProps({
  productoPreseleccionado: { type: [Number, String], default: null }
})

const emit = defineEmits(['movimiento-registrado', 'cancelar'])

const cargando = ref(false)
const alertaExito = ref(false)
const alertaError = ref('')
const alertaInfo = ref(false)
const mensajeExito = ref('')
const errores = reactive({})

const form = reactive({
  tipo_movimiento: '',
  id_producto: '',
  cantidad: '',
  observacion: ''
})

const productos = ref(getProducts())
const usuario = getCurrentUser()

const productosDisponibles = computed(() => productos.value)

const productoSeleccionado = computed(() => {
  return productos.value.find(p => p.id_producto === Number(form.id_producto))
})

const calcularNuevoStock = computed(() => {
  if (!productoSeleccionado.value || !form.cantidad) return 0
  const stock = Number(productoSeleccionado.value.stock_actual)
  const cant = Number(form.cantidad)
  if (form.tipo_movimiento === 'Entrada') {
    return stock + cant
  } else {
    return stock - cant
  }
})

const validarFormulario = () => {
  errores.tipo_movimiento = ''
  errores.id_producto = ''
  errores.cantidad = ''

  let valido = true

  if (!form.tipo_movimiento) {
    errores.tipo_movimiento = 'Seleccione el tipo de movimiento.'
    valido = false
  }

  if (!form.id_producto) {
    errores.id_producto = 'Seleccione un producto.'
    valido = false
  }

  const cantNum = Number(form.cantidad)
  if (!form.cantidad || !Number.isInteger(cantNum) || cantNum <= 0) {
    errores.cantidad = 'Ingrese una cantidad válida (número entero mayor a 0).'
    valido = false
  }

  // Validar stock suficiente para salidas
  if (form.tipo_movimiento === 'Salida' && productoSeleccionado.value) {
    if (cantNum > productoSeleccionado.value.stock_actual) {
      errores.cantidad = `Stock insuficiente. Disponible: ${productoSeleccionado.value.stock_actual} unidad(es).`
      valido = false
    }
  }

  return valido
}

const registrarMovimiento = async () => {
  if (!validarFormulario()) return

  cargando.value = true
  alertaError.value = ''
  alertaExito.value = false

  const movimientoData = {
    id_producto: Number(form.id_producto),
    tipo_movimiento: form.tipo_movimiento,
    cantidad: Number(form.cantidad),
    observacion: form.observacion.trim()
  }

  try {
    const resultado = registerMovement(movimientoData, usuario)

    if (resultado.success) {
      mensajeExito.value = `Movimiento de ${form.tipo_movimiento.toLowerCase()} registrado correctamente. Nuevo stock: ${resultado.nuevoStock} unidad(es).`
      alertaExito.value = true
      cargando.value = false
      setTimeout(() => {
        emit('movimiento-registrado', resultado.movement)
      }, 800)
    } else {
      alertaError.value = resultado.error || 'Error al registrar el movimiento.'
      cargando.value = false
    }
  } catch (err) {
    alertaError.value = 'Error inesperado al registrar el movimiento.'
    cargando.value = false
  }
}

// Si hay producto preseleccionado, asignarlo
watch(() => props.productoPreseleccionado, (nuevo) => {
  if (nuevo) {
    form.id_producto = String(nuevo)
  }
})
</script>

<style scoped>
.formulario-movimiento {
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

.resumen-movimiento {
  background-color: var(--color-azul-50);
  border: 1px solid var(--color-azul-200);
  border-radius: var(--radio-borde);
  padding: var(--espacio-16);
  margin-bottom: var(--espacio-24);
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--espacio-8);
  font-size: 14px;
}

.resumen-item:last-child {
  margin-bottom: 0;
}

.resumen-label {
  color: var(--color-gris-oscuro);
}

.resumen-valor {
  font-weight: 500;
  color: var(--color-negro);
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