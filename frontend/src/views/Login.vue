<template>
  <div class="login-contenedor">
    <div class="login-panel">
      <div class="login-marca">
        <span class="marca-nombre">stoq.</span>
        <p class="marca-eslogan">Tu stock, en orden.</p>
      </div>

      <div class="login-formulario">
        <h1 class="login-titulo">Iniciar sesión</h1>
        <p class="login-subtitulo">Ingresa a tu espacio</p>

        <Alert v-if="errorLogin" tipo="error" :mensaje="errorLogin" />

        <form @submit.prevent="manejarLogin" class="formulario-login">
          <CampoFormulario
            etiqueta="Correo electrónico *"
            id="email"
            tipo="input"
            v-model:valor="credenciales.email"
            placeholder="usuario@empresa.com"
            requerido
            :error="errores.email"
          />
          <CampoFormulario
            etiqueta="Contraseña *"
            id="password"
            tipo="input"
            v-model:valor="credenciales.password"
            type="password"
            placeholder="••••••••"
            requerido
            :error="errores.password"
          />
          <div class="olvido-contrasena">
            <a href="#" @click.prevent="olvidoContrasena">¿Olvidaste tu contraseña?</a>
          </div>
          <button
            class="btn btn-principal btn-login"
            type="submit"
            :disabled="cargando"
          >
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
        <p class="login-pie">
          ¿No tienes una cuenta?
          <a href="#" @-click.prevent="irRegistro">Regístrate</a>
        </p>
      </div>

      <div class="login-datos-demo" v-if="mostrarDemo">
        <div class="demo-card">
          <p class="demo-titulo">Usuario de demostración</p>
          <p class="demo-datos">
            <strong>Administrador:</strong> admin@stoq.com<br />
            <strong>Operador:</strong> operadora@stoq.com
          </p>
          <p class="demo-nota">
            * Contraseña: cualquiera (simulado)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/store'
import CampoFormulario from '@/components/common/Input.vue'
import Alert from '@/components/common/Alert.vue'

const router = useRouter()
const cargando = ref(false)
const errorLogin = ref('')
const mostrarDemo = ref(true)

const credenciales = reactive({
  email: '',
  password: ''
})

const errores = reactive({
  email: '',
  password: ''
})

const validarLogin = () => {
  errores.email = ''
  errores.password = ''
  let valido = true

  if (!credenciales.email) {
    errores.email = 'Ingrese su correo electrónico.'
    valido = false
  }

  if (!credenciales.password) {
    errores.password = 'Ingrese su contraseña.'
    valido = false
  }

  return valido
}

const manejarLogin = () => {
  if (!validarLogin()) return

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
  alert('Función de recuperación de contraseña simulada. En producción se enviaría un enlace de restablecimiento.')
}

const irRegistro = () => {
  alert('Pantalla de registro no incluida en los mocks de esta etapa.')
}
</script>

<style scoped>
.login-contenedor {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-blanco);
  padding: var(--espacio-24);
}

.login-panel {
  width: 100%;
  max-width: 480px;
  background-color: var(--color-blanco);
  border: var(--borde-base);
  border-radius: var(--radio-borde);
  padding: var(--espacio-32);
  box-shadow: var(--sombra-suave);
}

.login-marca {
  text-align: center;
  margin-bottom: var(--espacio-32);
}

.marca-nombre {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-azul-900);
  letter-spacing: -1px;
}

.marca-eslogan {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  margin-top: var(--espacio-8);
}

.login-titulo {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-negro);
  margin-bottom: var(--espacio-8);
}

.login-subtitulo {
  font-size: 14px;
  color: var(--color-gris-oscuro);
  margin-bottom: var(--espacio-24);
}

.formulario-login {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-16);
}

.olvido-contrasena {
  text-align: right;
  margin-top: -var(--espacio-8);
}

.olvido-contrasena a {
  font-size: 13px;
  color: var(--color-azul-500);
}

.btn-login {
  padding: var(--espacio-14);
  font-size: 15px;
  margin-top: var(--espacio-8);
}

.login-pie {
  margin-top: var(--espacio-24);
  font-size: 13px;
  color: var(--color-gris-oscuro);
  text-align: center;
}

.login-pie a {
  color: var(--color-azul-500);
  font-weight: 500;
}

.login-datos-demo {
  margin-top: var(--espacio-24);
  padding-top: var(--espacio-24);
  border-top: var(--borde-base);
}

.demo-card {
  background-color: var(--color-azul-50);
  border: 1px solid var(--color-azul-200);
  border-radius: var(--radio-borde);
  padding: var(--espacio-16);
}

.demo-titulo {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-azul-900);
  margin-bottom: var(--espacio-8);
}

.demo-datos {
  font-size: 13px;
  color: var(--color-negro);
  line-height: 1.6;
  margin-bottom: var(--espacio-8);
}

.demo-nota {
  font-size: 12px;
  color: var(--color-gris-texto);
  font-style: italic;
}

@media (max-width: 480px) {
  .login-panel {
    padding: var(--espacio-24);
  }
}
</style>