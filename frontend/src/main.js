import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { getTheme, toggleTheme } from '@/services/store'

// Inicializar tema guardado o modo claro por defecto
const dark = getTheme()
if (dark) {
  document.body.classList.add('dark')
}

createApp(App).use(router).mount('#app')
