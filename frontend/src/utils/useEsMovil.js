// Composable auxiliar: indica si la pantalla corresponde al layout móvil.
// Evita renderizar dos veces la misma información (tabla + tarjetas).
import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useEsMovil = (consulta = '(max-width: 768px)') => {
  const esMovil = ref(typeof window !== 'undefined' ? window.matchMedia(consulta).matches : false)
  let mediaQuery = null

  const actualizar = (evento) => {
    esMovil.value = evento.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(consulta)
    esMovil.value = mediaQuery.matches
    mediaQuery.addEventListener('change', actualizar)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', actualizar)
  })

  return { esMovil }
}
