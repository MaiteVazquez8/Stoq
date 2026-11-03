<template>
  <div class="campo">
    <label
      class="campo-control"
      :class="{ 'campo-control--error': !!error, 'campo-control--estatico': tipo === 'estatico' }"
      :for="idCampo"
    >
      <span class="campo-etiqueta">
        {{ etiqueta }}<span v-if="requerido" class="campo-obligatorio"> *</span>
      </span>

      <select
        v-if="tipo === 'select'"
        :id="idCampo"
        class="campo-select"
        :value="modelValue"
        :disabled="deshabilitado"
        :aria-describedby="descritoPor"
        :aria-invalid="!!error"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="opcion in opcionesNormalizadas"
          :key="opcion.valor"
          :value="opcion.valor"
        >
          {{ opcion.texto }}
        </option>
      </select>

      <textarea
        v-else-if="tipo === 'textarea'"
        :id="idCampo"
        class="campo-area"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="deshabilitado"
        :rows="filas"
        :aria-describedby="descritoPor"
        :aria-invalid="!!error"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>

      <span v-else-if="tipo === 'estatico'" class="campo-entrada" :id="idCampo">
        <slot>{{ valorMostrado }}</slot>
      </span>

      <input
        v-else
        :id="idCampo"
        class="campo-entrada"
        :type="tipo"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="deshabilitado"
        :readonly="soloLectura"
        :inputmode="inputmode"
        :step="step"
        :min="min"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        :aria-describedby="descritoPor"
        :aria-invalid="!!error"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <span v-if="error" :id="`${idCampo}-error`" class="campo-error" role="alert">{{ error }}</span>
      <span v-else-if="ayuda" :id="`${idCampo}-ayuda`" class="campo-ayuda">{{ ayuda }}</span>
    </label>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  etiqueta: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  tipo: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  ayuda: { type: String, default: '' },
  error: { type: String, default: '' },
  requerido: { type: Boolean, default: false },
  deshabilitado: { type: Boolean, default: false },
  soloLectura: { type: Boolean, default: false },
  opciones: { type: Array, default: () => [] },
  filas: { type: [Number, String], default: 3 },
  inputmode: { type: String, default: undefined },
  step: { type: [String, Number], default: undefined },
  min: { type: [String, Number], default: undefined },
  maxlength: { type: [String, Number], default: undefined },
  autocomplete: { type: String, default: 'off' },
  nombre: { type: String, required: false, default: '' }
})

defineEmits(['update:modelValue'])

const idCampo = computed(() =>
  props.nombre ? `campo-${props.nombre}` : `campo-${props.etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
)

const descritoPor = computed(() => {
  if (props.error) return `${idCampo.value}-error`
  if (props.ayuda) return `${idCampo.value}-ayuda`
  return undefined
})

const opcionesNormalizadas = computed(() =>
  props.opciones.map(opcion =>
    typeof opcion === 'object' ? opcion : { valor: opcion, texto: opcion }
  )
)

const valorMostrado = computed(() => (props.modelValue === '' || props.modelValue === null ? '—' : props.modelValue))
</script>
