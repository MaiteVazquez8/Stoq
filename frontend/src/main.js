import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

// Se monta después de que la ruta inicial esté resuelta, para evitar un
// render previo con el shell de aplicación en rutas públicas.
const app = createApp(App)
app.use(router)
router.isReady().then(() => app.mount('#app'))
