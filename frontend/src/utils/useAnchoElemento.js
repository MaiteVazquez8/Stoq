// Composable auxiliar: mide el ancho real de un elemento para que los gráficos
// SVG se dibujen a escala 1:1 (textos y trazos nítidos).
import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useAnchoElemento = (anchoInicial = 600) => {
  const elemento = ref(null)
  const ancho = ref(anchoInicial)
  let observador = null

  const medir = () => {
    if (elemento.value) {
      const nuevo = Math.round(elemento.value.clientWidth)
      if (nuevo > 0) ancho.value = nuevo
    }
  }

  onMounted(() => {
    medir()
    if (typeof ResizeObserver !== 'undefined') {
      observador = new ResizeObserver(medir)
      observador.observe(elemento.value)
    } else {
      window.addEventListener('resize', medir)
    }
  })

  onBeforeUnmount(() => {
    if (observador) observador.disconnect()
    else window.removeEventListener('resize', medir)
  })

  return { elemento, ancho }
}
