<template>
  <div class="contenedor-menu">
    <button
      type="button"
      class="btn btn-icono"
      :aria-expanded="abierto ? 'true' : 'false'"
      :aria-label="`Acciones para ${producto.nombre}`"
      @click.stop="$emit('alternar')"
    >
      <Icon nombre="menu" :tamano="18" />
    </button>

    <div v-if="abierto" class="menu-contextual menu-fila" role="menu" @click.stop>
      <button type="button" class="menu-contextual__opcion" role="menuitem" @click="$emit('ver')">
        <Icon nombre="ojo" :tamano="18" class="menu-contextual__check" />
        Ver detalle
      </button>
      <button v-if="isAdmin" type="button" class="menu-contextual__opcion" role="menuitem" @click="$emit('editar')">
        <Icon nombre="lapiz" :tamano="18" class="menu-contextual__check" />
        Editar producto
      </button>
      <button type="button" class="menu-contextual__opcion" role="menuitem" @click="$emit('movimiento')">
        <Icon nombre="movimientos" :tamano="18" class="menu-contextual__check" />
        Registrar movimiento
      </button>
    </div>
  </div>
</template>

<script setup>
import Icon from '@/components/common/Icon.vue'
import { isAdmin } from '@/services/store'

defineProps({
  producto: { type: Object, required: true },
  abierto: { type: Boolean, default: false }
})

defineEmits(['alternar', 'ver', 'editar', 'movimiento'])
</script>

<style scoped>
.contenedor-menu {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.menu-fila {
  top: calc(100% + 4px);
  right: 0;
}

@media (max-width: 768px) {
  .contenedor-menu {
    justify-content: flex-start;
  }

  .menu-fila {
    left: 0;
    right: auto;
  }
}
</style>
