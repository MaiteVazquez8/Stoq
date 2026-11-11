<template>
  <div v-if="abierto" class="modal-fondo" @click.self="cancelar">
    <div
      ref="caja"
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="idTitulo"
      @keydown.esc.stop.prevent="cancelar"
    >
      <h2 :id="idTitulo" ref="tituloRef" class="modal__titulo" tabindex="-1">{{ titulo }}</h2>

      <div class="modal__cuerpo">
        <slot />
      </div>

      <div class="modal__acciones">
        <Button variante="secundario" :deshabilitado="procesando" @click="cancelar">
          {{ textoCancelar }}
        </Button>
        <Button
          variante="principal"
          :cargando="procesando"
          :texto-cargando="textoProcesando"
          @click="$emit('confirmar')"
        >
          {{ textoConfirmar }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Button from '@/components/common/Button.vue'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  titulo: { type: String, default: 'Confirmar operación' },
  textoConfirmar: { type: String, default: 'Confirmar' },
  textoCancelar: { type: String, default: 'Cancelar' },
  textoProcesando: { type: String, default: 'Procesando…' },
  procesando: { type: Boolean, default: false }
})

const emit = defineEmits(['confirmar', 'cancelar'])

const caja = ref(null)
const tituloRef = ref(null)
const idTitulo = 'titulo-modal-confirmacion'

const cancelar = () => {
  if (!props.procesando) emit('cancelar')
}

const alPresionarTecla = (evento) => {
  if (evento.key === 'Escape') cancelar()
}

watch(
  () => props.abierto,
  async (abierto) => {
    if (abierto) {
      window.addEventListener('keydown', alPresionarTecla)
      await nextTick()
      tituloRef.value?.focus()
    } else {
      window.removeEventListener('keydown', alPresionarTecla)
    }
  }
)

onBeforeUnmount(() => window.removeEventListener('keydown', alPresionarTecla))
</script>
