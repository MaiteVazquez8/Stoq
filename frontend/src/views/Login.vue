<template>
  <div class="ingreso">
    <header class="ingreso__barra">
      <RouterLink class="marca" :to="{ name: 'inicio' }" aria-label="Stoq, volver al inicio">
        <span class="marca__texto">stoq</span><span class="marca__punto">.</span>
      </RouterLink>

      <div class="ingreso__barra-acciones">
        <button type="button" class="enlace-tema" @click="alternarTema">
          <Icon :nombre="oscuro ? 'sol' : 'luna'" :tamano="14" />
          {{ oscuro ? 'Modo oscuro' : 'Modo claro' }}
        </button>
        <RouterLink class="enlace-volver" :to="{ name: 'inicio' }">
          <Icon nombre="flecha-izquierda" :tamano="16" />
          Volver al inicio
        </RouterLink>
      </div>
    </header>

    <div class="ingreso__cuerpo">
      <section class="ingreso__presentacion">
        <h1 class="ingreso__titulo">Tu stock merece un lugar más simple.</h1>
        <p class="ingreso__bajada">
          Volvé a tu espacio y seguí con lo que importa: hacer crecer tu emprendimiento.
        </p>
        <p class="ingreso__negocio">{{ negocio.etiqueta }}</p>
        <p class="ingreso__unidades">{{ resumen.totalUnidades }}</p>
        <p class="texto-secundario">unidades ordenadas en un solo lugar.</p>
      </section>

      <section class="ingreso__formulario">
        <h2 class="texto-seccion">Ingresá a tu espacio</h2>
        <p class="texto-secundario">Bienvenida de nuevo. Tu inventario te está esperando.</p>

        <Alert
          v-if="mensajeError"
          tipo="error"
          titulo="No pudimos iniciar sesión"
          :mensaje="mensajeError"
        />

        <form class="ingreso__form" novalidate @submit.prevent="ingresar">
          <Input
            v-model="credenciales.email"
            etiqueta="Correo electrónico"
            nombre="correo"
            tipo="email"
            placeholder="usuario@empresa.com"
            autocomplete="username"
            :error="errores.email"
          />

          <Input
            v-model="credenciales.password"
            etiqueta="Contraseña"
            nombre="contrasena"
            :tipo="mostrarContrasena ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            :error="errores.password"
          />

          <label class="ingreso__mostrar fila">
            <input v-model="mostrarContrasena" type="checkbox" />
            Mostrar contraseña
          </label>

          <a class="ingreso__olvido" href="#" @click.prevent="olvidoContrasena">
            ¿Te olvidaste la contraseña?
          </a>

          <Button tipo="submit" bloque :cargando="cargando" texto-cargando="Ingresando…">
            Ingresar
          </Button>
        </form>

        <p class="texto-meta">Tu información, en tu espacio de trabajo.</p>
      </section>
    </div>

    <footer class="ingreso__pie">Stoq · Gestión de stock · {{ oscuro ? 'Modo oscuro' : 'Modo claro' }}</footer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/common/Alert.vue'
import Button from '@/components/common/Button.vue'
import Icon from '@/components/common/Icon.vue'
import Input from '@/components/common/Input.vue'
import { isDarkTheme, login, toggleTheme } from '@/services/store'
import { resumenInventario } from '@/services/analytics'
import { hayErrores } from '@/utils/validation'
import { negocio } from '@/data/business'

const router = useRouter()

const credenciales = reactive({ email: '', password: '' })
const errores = reactive({ email: '', password: '' })
const mensajeError = ref('')
const cargando = ref(false)
const mostrarContrasena = ref(false)

const oscuro = computed(() => isDarkTheme.value)
const resumen = computed(() => resumenInventario())

const alternarTema = () => toggleTheme()

const validar = () => {
  errores.email = ''
  errores.password = ''

  const resultado = {}
  if (!credenciales.email.trim()) {
    resultado.email = 'Ingresá tu correo electrónico.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credenciales.email.trim())) {
    resultado.email = 'Revisá el formato del correo. Ej.: lucia@casanube.com.ar'
  }
  if (!credenciales.password) {
    resultado.password = 'Ingresá tu contraseña.'
  }

  Object.assign(errores, resultado)
  return !hayErrores(resultado)
}

const ingresar = () => {
  mensajeError.value = ''

  if (!validar()) {
    mensajeError.value = 'Revisá los datos marcados para continuar.'
    return
  }

  cargando.value = true
  const respuesta = login(credenciales.email, credenciales.password)
  cargando.value = false

  if (!respuesta.success) {
    mensajeError.value = respuesta.error
    return
  }

  router.push({ name: 'panel' })
}

const olvidoContrasena = () => {
  mensajeError.value = 'La recuperación de contraseña es una simulación: en esta versión ingresá con tu correo y una contraseña de 4 caracteres o más.'
}
</script>

<style scoped>
.ingreso {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--superficie);
}

.ingreso__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-16) var(--esp-24);
  border-bottom: var(--borde-base);
  flex-wrap: wrap;
}

.ingreso__barra-acciones { display: flex; align-items: center; gap: var(--esp-16); }

.ingreso__cuerpo {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
}

.ingreso__presentacion {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
  height: 100%;
  padding: var(--esp-64) var(--esp-48);
  background-color: var(--azul-50);
  justify-content: center;
}

.ingreso__titulo { font-size: 44px; font-weight: 600; line-height: 1.2; }
.ingreso__bajada { font-size: 16px; color: var(--n-600); max-width: 460px; }
.ingreso__negocio { font-size: 15px; font-weight: 500; color: var(--azul-900); margin-top: var(--esp-16); }
.ingreso__unidades { font-size: 56px; font-weight: 600; line-height: 1; }

.ingreso__formulario {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: var(--esp-48) var(--esp-24);
}

.ingreso__form { display: flex; flex-direction: column; gap: var(--esp-16); }
.ingreso__mostrar { font-size: 13px; color: var(--texto-secundario); }
.ingreso__mostrar input { accent-color: var(--azul-500); }
.ingreso__olvido { font-size: 14px; }

.ingreso__pie {
  padding: var(--esp-16) var(--esp-24) var(--esp-24);
  text-align: center;
  font-size: 13px;
  color: var(--texto-secundario);
}

@media (max-width: 900px) {
  .ingreso__cuerpo { grid-template-columns: minmax(0, 1fr); }
  .ingreso__presentacion { padding: var(--esp-32) var(--esp-24); }
  .ingreso__titulo { font-size: 34px; }
  .ingreso__unidades { font-size: 44px; }
  .ingreso__formulario { padding: var(--esp-32) var(--esp-16); }
}
</style>
