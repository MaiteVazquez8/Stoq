<template>
  <form class="pila--24" novalidate @submit.prevent="guardar">
    <Alert
      v-if="mensajeExito"
      tipo="exito"
      titulo="Producto guardado"
      :mensaje="mensajeExito"
    />

    <Alert
      v-if="mensajeError"
      tipo="error"
      titulo="No pudimos guardar el producto"
      :mensaje="mensajeError"
    />

    <div class="grilla-dos grilla-dos--amplia">
      <Input
        v-model="form.nombre"
        etiqueta="Nombre del producto"
        nombre="nombre-producto"
        placeholder="Ej.: Vela de soja · Ámbar"
        :requerido="true"
        :error="errores.nombre"
        :maxlength="80"
      />

      <Input
        v-model="form.codigo"
        etiqueta="SKU"
        nombre="sku-producto"
        placeholder="Ej.: VEL-004"
        :requerido="true"
        :error="errores.codigo"
        ayuda="Código único del producto."
        :maxlength="20"
      />

      <Input
        v-model="form.id_categoria"
        etiqueta="Categoría"
        nombre="categoria-producto"
        tipo="select"
        placeholder="Elegí una categoría"
        :requerido="true"
        :opciones="opcionesCategorias"
        :error="errores.id_categoria"
      />

      <Input
        v-model="form.unidad_medida"
        etiqueta="Unidad de medida"
        nombre="unidad-producto"
        tipo="select"
        placeholder="Elegí una unidad"
        :requerido="true"
        :opciones="UNIDADES"
        :error="errores.unidad_medida"
      />

      <Input
        v-model="form.precio"
        etiqueta="Precio"
        nombre="precio-producto"
        type="text"
        inputmode="decimal"
        placeholder="Ej.: 4500"
        :requerido="true"
        ayuda="Precio de venta en pesos."
        :error="errores.precio"
      />

      <Input
        v-model="form.stock_minimo"
        etiqueta="Stock mínimo"
        nombre="stock-minimo"
        type="text"
        inputmode="numeric"
        placeholder="Ej.: 20"
        :requerido="true"
        ayuda="Aviso al llegar a este valor o menos."
        :error="errores.stock_minimo"
      />

      <Input
        v-if="!esEdicion"
        v-model="form.cantidad_inicial"
        etiqueta="Stock inicial"
        nombre="stock-inicial"
        type="text"
        inputmode="numeric"
        placeholder="Ej.: 84"
        :requerido="true"
        ayuda="Se registra como saldo inicial."
        :error="errores.cantidad_inicial"
      />

      <Input
        v-else
        :model-value="formatUnidadesLargas(producto?.stock_actual)"
        etiqueta="Stock actual"
        nombre="stock-actual"
        tipo="estatico"
        ayuda="Se modifica con entradas y salidas."
      />
    </div>

    <Input
      v-model="form.descripcion"
      etiqueta="Descripción / Opcional"
      nombre="descripcion-producto"
      tipo="textarea"
      :filas="3"
      placeholder="Ej.: Vela de soja de 200 g. Aroma ámbar. Frasco de vidrio."
      :maxlength="240"
    />

    <Alert
      tipo="info"
      :mensaje="esEdicion
        ? 'Para cambiar existencias, registrá una entrada o salida. Editar no modifica el saldo ni los movimientos anteriores.'
        : 'Empezá con el stock de hoy. Si no tenés unidades, dejalo en 0 y después registrá una entrada.'"
    />

    <div>
      <RouterLink class="enlace-volver" :to="{ name: 'productos' }">
        <Icon nombre="flecha-izquierda" :tamano="16" />
        Cancelar y volver a productos
      </RouterLink>
    </div>

    <div class="fila">
      <Button tipo="submit" :cargando="guardando" :texto-cargando="esEdicion ? 'Guardando…' : 'Creando…'">
        {{ esEdicion ? 'Guardar cambios' : 'Crear producto' }}
      </Button>
    </div>

    <p class="texto-meta">{{ pie }}</p>
  </form>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import { getCategories, isAdmin, createProduct, updateProduct, findProductByCode, getProducts } from '@/services/store'
import { validarProducto, hayErrores } from '@/utils/validation'
import { formatUnidadesLargas } from '@/utils/format'

const props = defineProps({
  producto: { type: Object, default: null },
  esEdicion: { type: Boolean, default: false }
})

const emit = defineEmits(['guardado'])

const UNIDADES = ['Unidad', 'Pack', 'Caja']

const opcionesCategorias = computed(() =>
  getCategories().map(categoria => ({ valor: categoria.id_categoria, texto: categoria.nombre }))
)

const form = reactive({
  nombre: '',
  codigo: '',
  id_categoria: '',
  unidad_medida: '',
  precio: '',
  stock_minimo: '',
  cantidad_inicial: '',
  descripcion: ''
})

const errores = reactive({})
const guardando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

const cargarProducto = (producto) => {
  form.nombre = producto?.nombre || ''
  form.codigo = producto?.codigo || ''
  form.id_categoria = producto?.id_categoria ?? ''
  form.unidad_medida = producto?.unidad_medida || 'Unidad'
  form.precio = producto ? String(producto.precio) : ''
  form.stock_minimo = producto ? String(producto.stock_minimo) : ''
  form.cantidad_inicial = ''
  form.descripcion = producto?.descripcion || ''
  Object.keys(errores).forEach(clave => delete errores[clave])
  mensajeExito.value = ''
  mensajeError.value = ''
}

watch(() => props.producto, cargarProducto, { immediate: true })

const pie = computed(() => {
  if (props.esEdicion) {
    return `${props.producto?.codigo || ''} · Stock actual: ${formatUnidadesLargas(props.producto?.stock_actual || 0)}.`
  }
  const totalProductos = getProducts().length
  const totalUnidades = getProducts().reduce((total, p) => total + p.stock_actual, 0)
  return `Borrador de ${form.codigo || 'nuevo producto'}. Todavía no forma parte de los ${totalProductos} productos ni de las ${totalUnidades} unidades.`
})

const guardar = () => {
  mensajeExito.value = ''
  mensajeError.value = ''

  if (!isAdmin.value) {
    mensajeError.value = 'Tu perfil no tiene permiso para gestionar productos.'
    return
  }

  const codigoDuplicado = Boolean(
    findProductByCode(form.codigo, props.esEdicion ? props.producto?.id_producto : null)
  )

  const resultadoValidacion = validarProducto(form, { esEdicion: props.esEdicion, codigoDuplicado })
  Object.keys(errores).forEach(clave => delete errores[clave])
  Object.assign(errores, resultadoValidacion)

  if (hayErrores(resultadoValidacion)) {
    mensajeError.value = 'Revisá los campos marcados para continuar.'
    return
  }

  guardando.value = true

  const respuesta = props.esEdicion
    ? updateProduct(props.producto.id_producto, form)
    : createProduct(form)

  guardando.value = false

  if (!respuesta.success) {
    mensajeError.value = respuesta.error
    if (respuesta.campo) errores[respuesta.campo] = respuesta.error
    return
  }

  mensajeExito.value = props.esEdicion
    ? `Los cambios de ${respuesta.product.codigo} se guardaron correctamente.`
    : `${respuesta.product.nombre} (${respuesta.product.codigo}) se agregó al catálogo con ${respuesta.product.stock_actual} unidades.`

  emit('guardado', respuesta.product)
}
</script>
