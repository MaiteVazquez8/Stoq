<template>
  <div class="campo-formulario" :class="{ 'con-error': error }">
    <label :for="id" class="etiqueta">
      {{ etiqueta }}
      <span v-if="requerido" class="requerido"> *</span>
    </label>

    <component
      :is="tipo"
      :id="id"
      v-model="valorInterno"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ error }"
      @input="actualizarValor"
    />

    <div v-if="error" class="mensaje-error">{{ error }}</div>
    <div v-else-if="textoAyuda" class="texto-ayuda">{{ textoAyuda }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  etiqueta: { type: String, required: true },
  tipo: { type: String, default: 'input' }, // input, select, textarea
  id: { type: String, required: true },
  valor: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  requerido: { type: Boolean, default: false },
  error: { type: String, default: '' },
  textoAyuda: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:valor'])

const valorInterno = ref(props.valor)

const actualizarValor = (event) => {
  const nuevoValor = event.target.value
  valorInterno.value = nuevoValor
  emit('update:valor', nuevoValor)
}

computed(() => {
  valorInterno.value = props.valor
})
</script>

<style scoped>
.campo-formulario {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
  margin-bottom: var(--espacio-16);
}

.etiqueta {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-negro);
  display: flex;
  align-items: center;
}

.requerido {
  color: var(--color-azul-500);
  margin-left: var(--espacio-4);
}

input,
select,
textarea {
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  width: 100%;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-azul-500);
}

input.error,
select.error,
textarea.error {
  border-color: var(--color-error);
}

.mensaje-error {
  font-size: 12px;
  color: var(--color-error);
}

.texto-ayuda {
  font-size: 12px;
  color: var(--color-gris-texto);
}
</style>