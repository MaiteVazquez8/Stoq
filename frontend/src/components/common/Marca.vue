<template>
  <img :src="archivo" :alt="alt" class="marca-imagen" :style="estilo" />
</template>

<script setup>
// Componente de marca de Stoq.
// Selecciona automáticamente la variante del logo según el tema activo
// (claro / oscuro). Los archivos oficiales viven en assets/images/logos/
// (copias recortadas de marketing/logos/, sin alterar ni recolorear).

import { computed } from 'vue'
import { isDarkTheme } from '@/services/store'
import logoIsotipoLight from '@/assets/images/logos/logo-isotipo-azul-oscuro.png'
import logoIsotipoDark from '@/assets/images/logos/logo-isotipo-celeste.png'
import logoHorizontalLight from '@/assets/images/logos/logo-horizontal-azul-oscuro.png'
import logoHorizontalDark from '@/assets/images/logos/logo-horizontal-celeste-claro.png'
import logoVerticalLight from '@/assets/images/logos/logo-vertical-azul-oscuro.png'
import logoVerticalDark from '@/assets/images/logos/logo-vertical-celeste-claro.png'

const props = defineProps({
  variante: {
    type: String,
    default: 'horizontal',
    validator: (valor) => ['horizontal', 'isotipo', 'vertical'].includes(valor)
  },
  altura: { type: [Number, String], default: 28 },
  alt: { type: String, default: 'Stoq' }
})

const FUENTES = {
  horizontal: [logoHorizontalLight, logoHorizontalDark],
  isotipo: [logoIsotipoLight, logoIsotipoDark],
  vertical: [logoVerticalLight, logoVerticalDark]
}

const archivo = computed(() => (isDarkTheme.value ? FUENTES[props.variante][1] : FUENTES[props.variante][0]))
const estilo = computed(() => ({ height: `${Number(props.altura) || 28}px` }))
</script>

<style scoped>
.marca-imagen {
  display: block;
  width: auto;
  max-width: 100%;
  flex: 0 0 auto;
  align-self: flex-start;
}
</style>
