<template>
  <div class="login-page">
    <div class="login-brand">
      <img src="@/assets/images/logo-stoq.png" alt="Stoq" class="login-logo" />
    </div>

    <div class="login-panel">
      <div class="login-text">
        <h1 class="login-title">Tu stock merece un lugar más simple.</h1>
        <p class="login-subtitle">
          Volvé a tu espacio y seguí con lo que importa:
          Gestioná tus productos y partidas pendientes desde un solo lugar,
          sin complicaciones.
        </p>
      </div>

      <div class="login-demo">
        <span class="demo-label">Casa Nube - Demo</span>
        <span class="demo-number">262</span>
      </div>

      <form @submit.prevent="manejarLogin" class="login-form">
        <div class="field">
          <label class="field-label">Correo electrónico</label>
          <input
            type="email"
            v-model="credenciales.email"
            placeholder="usuario@empresa.com"
            class="field-input"
          />
        </div>
        <div class="field">
          <label class="field-label">Contraseña</label>
          <input
            type="password"
            v-model="credenciales.password"
            placeholder="••••••••"
            class="field-input"
          />
        </div>
        <div class="forgot">
          <a href="#" @click.prevent="olvidoContrasena">¿Te perdiste la contraseña?</a>
        </div>
        <button type="submit" class="btn-login" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>

    <Alert v-if="errorLogin" tipo="error" :mensaje="errorLogin" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/store'
import Alert from '@/components/common/Alert.vue'

const router = useRouter()
const cargando = ref(false)
const errorLogin = ref('')

const credenciales = reactive({
  email: '',
  password: ''
})

const manejarLogin = () => {
  cargando.value = true
  errorLogin.value = ''

  const resultado = login(credenciales.email, credenciales.password)

  if (resultado.success) {
    router.push({ name: 'dashboard' })
  } else {
    errorLogin.value = resultado.error
    cargando.value = false
  }
}

const olvidoContrasena = () => {
  alert('Función de recuperación de contraseña simulada.')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: var(--color-blanco);
  display: flex;
  flex-direction: column;
}

.login-brand {
  padding: var(--espacio-24);
  border-bottom: var(--borde-base);
}

.login-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.login-panel {
  flex: 1;
  padding: var(--espacio-32) var(--espacio-24);
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: var(--espacio-48);
  align-items: center;
}

.login-text {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-negro);
  line-height: 1.2;
  margin: 0;
}

.login-subtitle {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  line-height: 1.6;
  margin: 0;
}

.login-demo {
  margin-top: var(--espacio-24);
  text-align: right;
}

.demo-label {
  display: block;
  font-size: 13px;
  color: var(--color-gris-oscuro);
  margin-bottom: var(--espacio-4);
}

.demo-number {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: var(--color-azul-900);
}

.login-form {
  width: 100%;
  max-width: 360px;
}

.field {
  margin-bottom: var(--espacio-16);
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-negro);
  margin-bottom: var(--espacio-8);
}

.field-input {
  width: 100%;
  padding: var(--espacio-12);
  font-family: var(--fuente-principal);
  font-size: 14px;
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  background-color: var(--color-blanco);
  color: var(--color-negro);
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-azul-500);
}

.forgot {
  text-align: right;
  margin-bottom: var(--espacio-20);
}

.forgot a {
  font-size: 13px;
  color: var(--color-azul-500);
  text-decoration: none;
}

.btn-login {
  width: 100%;
  padding: var(--espacio-14);
  font-family: var(--fuente-principal);
  font-size: 15px;
  font-weight: 500;
  background-color: var(--color-azul-500);
  color: var(--color-blanco);
  border: none;
  border-radius: var(--radio-borde);
  cursor: pointer;
  margin-bottom: var(--espacio-16);
}

.btn-login:hover:not(:disabled) {
  background-color: #1976D2;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .login-panel {
    grid-template-columns: 1fr;
    gap: var(--espacio-24);
    padding: var(--espacio-24) var(--espacio-16);
  }

  .login-demo {
    text-align: left;
  }

  .login-form {
    max-width: 100%;
  }
}
</style>