<template>
  <div>
    <table v-if="!esMovil" class="tabla tabla-escritorio">
      <thead>
        <tr>
          <th scope="col">Fecha</th>
          <th scope="col">Producto / Motivo</th>
          <th scope="col" class="celda-numero">{{ compacto ? 'Cant.' : 'Tipo / Cant.' }}</th>
          <th scope="col" class="celda-numero">Saldo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="movimiento in movimientos" :key="movimiento.id_movimiento">
          <td class="celda-fecha">
            <div class="fila-principal">
              <span>{{ formatFechaCorta(movimiento.fecha_hora) }}</span>
              <span>{{ formatHora(movimiento.fecha_hora) }}</span>
            </div>
          </td>
          <td>
            <div class="fila-principal">
              <span>{{ nombreProducto(movimiento) }}</span>
              <span class="celda-sub">{{ descripcionMovimiento(movimiento) }}</span>
            </div>
          </td>
          <td class="celda-numero">
            <div class="fila-principal fila-principal--fin">
              <span v-if="!compacto" class="tipo-movimiento">
                <Icon :nombre="movimiento.tipo_movimiento === 'Entrada' ? 'flecha-abajo' : 'flecha-arriba'" :tamano="14" />
                {{ movimiento.tipo_movimiento }}
              </span>
              <span class="cantidad-movimiento">{{ formatCantidadConSigno(movimiento.tipo_movimiento, movimiento.cantidad) }}</span>
            </div>
          </td>
          <td class="celda-numero">{{ formatSaldo(movimiento.saldo_resultante) }}</td>
        </tr>
      </tbody>
    </table>

    <ul v-if="esMovil" class="lista-tarjetas">
      <li v-for="movimiento in movimientos" :key="`tarjeta-${movimiento.id_movimiento}`" class="tarjeta-movimiento">
        <p class="tipo-movimiento">
          <Icon :nombre="movimiento.tipo_movimiento === 'Entrada' ? 'flecha-abajo' : 'flecha-arriba'" :tamano="14" />
          {{ movimiento.tipo_movimiento }} · {{ formatCantidadConSigno(movimiento.tipo_movimiento, movimiento.cantidad) }}
        </p>
        <p class="texto-cuerpo">{{ nombreProducto(movimiento) }}</p>
        <p class="texto-meta">
          {{ formatFechaHoraCorta(movimiento.fecha_hora) }} · Saldo: {{ formatSaldo(movimiento.saldo_resultante) }}
        </p>
        <p class="texto-meta">{{ descripcionMovimiento(movimiento) }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import Icon from '@/components/common/Icon.vue'
import { useEsMovil } from '@/utils/useEsMovil'
import { formatCantidadConSigno, formatFechaCorta, formatFechaHoraCorta, formatHora, formatUnidades } from '@/utils/format'

defineProps({
  movimientos: { type: Array, required: true },
  compacto: { type: Boolean, default: false }
})

const { esMovil } = useEsMovil()

const nombreProducto = (movimiento) =>
  movimiento.producto_nombre || 'Producto (sin datos)'

const descripcionMovimiento = (movimiento) => {
  const motivo = movimiento.motivo || 'Movimiento de stock'
  const responsable = movimiento.usuario_nombre || 'Usuario'
  return `${motivo} · ${responsable}`
}

const formatSaldo = (saldo) =>
  saldo === null || saldo === undefined ? '—' : formatUnidades(saldo)
</script>

<style scoped>
.fila-principal--fin {
  align-items: flex-end;
}

.tipo-movimiento {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-4);
  color: var(--azul-500);
  font-size: 13px;
}

.cantidad-movimiento {
  color: var(--azul-500);
  font-variant-numeric: tabular-nums;
}

.lista-tarjetas {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tarjeta-movimiento {
  display: flex;
  flex-direction: column;
  gap: var(--esp-4);
  padding: var(--esp-16);
  background-color: var(--superficie);
  border: var(--borde-base);
  border-radius: var(--radio-tarjeta);
}

.tarjeta-movimiento + .tarjeta-movimiento {
  margin-top: var(--esp-12);
}

@media (max-width: 768px) {
  .tabla-escritorio {
    display: none;
  }

  .lista-tarjetas {
    display: block;
  }
}
</style>
