<template>
  <div class="inicio">
    <header class="inicio__barra">
      <RouterLink class="marca" :to="{ name: 'inicio' }" aria-label="Stoq, volver al inicio">
        <span class="marca__texto">stoq</span><span class="marca__punto">.</span>
      </RouterLink>

      <nav class="inicio__nav" aria-label="Secciones del inicio">
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#preguntas">Preguntas frecuentes</a>
      </nav>

      <div class="inicio__acciones">
        <button type="button" class="enlace-tema" @click="alternarTema">
          <Icon :nombre="oscuro ? 'sol' : 'luna'" :tamano="14" />
          {{ oscuro ? 'Modo oscuro' : 'Modo claro' }}
        </button>
        <Button variante="secundario" @click="irIngresar">Ingresar</Button>
      </div>
    </header>

    <section class="inicio__hero">
      <p class="texto-etiqueta">Menos planillas. Más claridad.</p>
      <h1 class="texto-display">Tu emprendimiento crece. Tu stock, en orden.</h1>
      <p class="inicio__bajada">
        Stoq te ayuda a saber qué tenés, qué entra y qué sale. Gestioná tus productos y
        anticipá faltantes desde un solo lugar, sin complicarte.
      </p>

      <div class="fila">
        <Button grande @click="irIngresar">Entrar a mi espacio</Button>
      </div>

      <ul class="inicio__sellos">
        <li v-for="sello in SELLOS" :key="sello">
          <Icon nombre="check" :tamano="14" />
          {{ sello }}
        </li>
      </ul>
    </section>

    <section id="como-funciona" class="inicio__seccion">
      <p class="texto-etiqueta">Todo a simple vista</p>
      <h2 class="texto-seccion">Abrí Stoq. Entendé tu día.</h2>
      <p class="inicio__texto">Un resumen de tus existencias, con los cambios y avisos que importan.</p>

      <div class="inicio__vista-previa">
        <p class="inicio__vista-titulo">stoq. / {{ negocio.etiqueta }}</p>

        <div class="metricas">
          <StatCard etiqueta="Productos" :valor="resumen.totalProductos" :contexto="`${resumen.totalCategorias} categorías activas`" />
          <StatCard etiqueta="Unidades en stock" :valor="resumen.totalUnidades" :contexto="`+${resumen.neto} en los últimos 7 días`" />
          <StatCard etiqueta="Stock bajo" :valor="resumen.stockBajo" contexto="Por debajo del mínimo" />
          <StatCard etiqueta="Agotados" :valor="resumen.agotados" contexto="Necesita reposición" />
        </div>

        <div class="panel">
          <p class="panel-titulo">Así se movió tu stock</p>
          <p class="grafico__leyenda">
            <span class="grafico__leyenda-item">
              <span class="grafico__marca grafico__marca--punto"></span>
              Existencias al cierre · unidades · {{ negocio.periodo }}
            </span>
          </p>
          <LineChart
            :valores="serie.valores"
            :etiquetas="serie.etiquetas"
            :altura="200"
            descripcion="Evolución de las existencias durante los últimos 7 días"
          />
        </div>
      </div>
    </section>

    <section class="inicio__seccion">
      <h2 class="texto-seccion">Más control. Menos vueltas.</h2>
      <div class="grilla-tres">
        <article v-for="beneficio in BENEFICIOS" :key="beneficio.titulo" class="inicio__beneficio">
          <h3>{{ beneficio.titulo }}</h3>
          <p class="texto-secundario">{{ beneficio.texto }}</p>
        </article>
      </div>
    </section>

    <section class="inicio__bloque">
      <div class="inicio__bloque-texto">
        <p class="texto-etiqueta">01 / Organizá tus productos</p>
        <h2 class="texto-seccion">Tu catálogo, sin perder el detalle.</h2>
        <p class="texto-secundario">
          Cargá tus productos una vez. Buscá por nombre o SKU, filtrá por categoría y
          consultá las existencias de cada uno. Nombre, SKU, categoría, unidad y mínimo: todo a mano.
        </p>
      </div>

      <div class="inicio__bloque-panel">
        <table class="tabla">
          <thead>
            <tr>
              <th scope="col">Producto / SKU</th>
              <th scope="col" class="celda-numero">Stock</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in destacados" :key="producto.id_producto">
              <td>
                <div class="fila-principal">
                  <span>{{ producto.nombre }}</span>
                  <span class="celda-sub">{{ producto.codigo }} · {{ getCategoryName(producto.id_categoria) }}</span>
                </div>
              </td>
              <td class="celda-numero">
                <div class="fila-principal">
                  <span class="stock-valor">{{ producto.stock_actual }}</span>
                  <span class="celda-sub">mín. {{ producto.stock_minimo }}</span>
                </div>
              </td>
              <td><Badge :estado="estadoStock(producto)" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="inicio__bloque inicio__bloque--invertido">
      <div class="inicio__bloque-texto">
        <p class="texto-etiqueta">02 / Registrá cada cambio</p>
        <h2 class="texto-seccion">Lo que entra. Lo que sale. Todo cuenta.</h2>
        <p class="texto-secundario">
          Elegí el producto, indicá la cantidad y contanos el motivo. Stoq actualiza el stock
          y guarda el movimiento para que lo puedas consultar. Sin cálculos a mano. Sin perder el historial.
        </p>
      </div>

      <div class="inicio__bloque-panel">
        <article class="inicio__movimiento">
          <p class="tipo-movimiento">
            <Icon nombre="flecha-abajo" :tamano="14" />
            Entrada · Producción terminada
          </p>
          <p class="inicio__movimiento-producto">Vela de soja · Ámbar</p>
          <p class="inicio__movimiento-linea">
            <span>60</span>
            <span class="inicio__movimiento-operacion">+24</span>
            <Icon nombre="flecha-derecha" :tamano="18" />
            <span>84</span>
          </p>
          <p class="texto-meta">Stock anterior → stock actual · unidades</p>
          <p class="texto-meta">{{ negocio.hoyTexto }} · VEL-001</p>
        </article>
      </div>
    </section>

    <section class="inicio__bloque">
      <div class="inicio__bloque-texto">
        <p class="texto-etiqueta">03 / Entendé tu inventario</p>
        <h2 class="texto-seccion">Decidí con el stock a la vista.</h2>
        <p class="texto-secundario">
          Seguí la evolución de tus existencias y detectá qué necesita atención.
          Los estados se leen con etiquetas e íconos, no solo con colores.
        </p>
      </div>

      <div class="inicio__bloque-panel">
        <ul class="lista-simple">
          <li v-for="item in muestraEstados" :key="item.id_producto" class="item-atencion">
            <span class="fila">
              <Badge :estado="estadoStock(item)" />
              <span class="item-atencion__producto">{{ item.nombre }}</span>
            </span>
            <span class="texto-secundario">
              {{ item.stock_actual }} u. · mínimo {{ item.stock_minimo }} ·
              {{ etiquetaEstado(estadoStock(item)) }}
            </span>
          </li>
        </ul>
      </div>
    </section>

    <section id="preguntas" class="inicio__seccion">
      <h2 class="texto-seccion">¿Te quedó alguna duda?</h2>
      <dl class="inicio__preguntas">
        <div v-for="pregunta in PREGUNTAS" :key="pregunta.titulo" class="inicio__pregunta">
          <dt>{{ pregunta.titulo }}</dt>
          <dd>{{ pregunta.respuesta }}</dd>
        </div>
      </dl>
    </section>

    <section class="inicio__cierre">
      <h2 class="texto-seccion">Tu próximo paso: tener todo en claro.</h2>
      <p class="texto-secundario">Menos tiempo contando. Más tiempo para tu emprendimiento.</p>
      <div class="fila">
        <Button grande @click="irIngresar">Ingresar a Stoq</Button>
      </div>
      <p class="texto-meta">stoq. · © 2026 · Simple, como debería ser.</p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import Icon from '@/components/common/Icon.vue'
import LineChart from '@/components/common/LineChart.vue'
import StatCard from '@/components/common/StatCard.vue'
import { getProducts, isDarkTheme, toggleTheme } from '@/services/store'
import {
  estadoStock,
  etiquetaEstado,
  resumenInventario,
  serieExistencias
} from '@/services/analytics'
import { getCategoryName } from '@/data/categories'
import { negocio } from '@/data/business'

const router = useRouter()
const oscuro = computed(() => isDarkTheme.value)

const resumen = computed(() => resumenInventario())
const serie = computed(() => serieExistencias())
const destacados = computed(() => getProducts().slice(0, 3))
const muestraEstados = computed(() => {
  const productos = getProducts()
  const primeroCon = (estado) => productos.find(p => estadoStock(p) === estado)
  return [primeroCon('suficiente'), primeroCon('bajo'), primeroCon('agotado')].filter(Boolean)
})

const alternarTema = () => toggleTheme()
const irIngresar = () => router.push({ name: 'ingresar' })

const SELLOS = ['Productos claros', 'Movimientos al día', 'Stock a la vista']

const BENEFICIOS = [
  {
    titulo: 'Encontrá lo que buscás',
    texto: 'Cada producto tiene su nombre, SKU y categoría. Todo en su lugar.'
  },
  {
    titulo: 'Cada cambio, registrado',
    texto: 'Entradas y salidas con fecha y motivo. Sabés cómo llegaste al stock actual.'
  },
  {
    titulo: 'Reponé a tiempo',
    texto: 'Definí mínimos y detectá productos con poco stock antes de que falten.'
  }
]

const PREGUNTAS = [
  {
    titulo: '¿Para quién está pensado Stoq?',
    respuesta: 'Para pequeños emprendimientos que necesitan ordenar sus productos y controlar existencias sin un sistema complicado.'
  },
  {
    titulo: '¿Cómo se actualiza el stock?',
    respuesta: 'Una entrada suma unidades; una salida las descuenta. Cada movimiento queda en el historial con su fecha y motivo.'
  },
  {
    titulo: '¿Puedo definir un stock mínimo?',
    respuesta: 'Sí. Cada producto tiene su mínimo. Stoq distingue stock suficiente, bajo y agotado para ayudarte a priorizar.'
  },
  {
    titulo: '¿Lo puedo usar desde el celular?',
    respuesta: 'Sí. El panel, los productos y los movimientos se adaptan a tu compu, tablet y celular.'
  }
]
</script>

<style scoped>
.inicio {
  display: flex;
  flex-direction: column;
  background-color: var(--superficie);
}

.inicio__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-16);
  padding: var(--esp-16) var(--esp-24);
  border-bottom: var(--borde-base);
  flex-wrap: wrap;
}

.inicio__nav { display: flex; gap: var(--esp-24); font-size: 14px; }
.inicio__nav a { color: var(--texto-secundario); }
.inicio__nav a:hover { color: var(--texto); }
.inicio__acciones { display: flex; align-items: center; gap: var(--esp-12); }

.inicio__hero {
  display: flex;
  flex-direction: column;
  gap: var(--esp-24);
  padding: var(--esp-64) var(--esp-24);
  background-color: var(--azul-50);
}

.inicio__hero h1,
.inicio__hero .inicio__bajada { max-width: 780px; }

.inicio__bajada {
  font-size: 18px;
  color: var(--n-600);
  max-width: 720px;
}

.inicio__sellos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-16);
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: var(--n-500);
}

.inicio__sellos li { display: inline-flex; align-items: center; gap: var(--esp-4); }

.inicio__seccion {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: var(--esp-64) var(--esp-24);
}

.inicio__texto { font-size: 16px; color: var(--texto-secundario); }

.inicio__vista-previa {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
  margin-top: var(--esp-16);
  padding: var(--esp-24);
  background-color: var(--n-100);
  border-radius: var(--radio-bloque);
}

.inicio__vista-titulo { font-size: 13px; color: var(--texto-secundario); }

.inicio__vista-previa .panel { background-color: var(--superficie); }

.inicio__beneficio {
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
  padding: var(--esp-24);
  background-color: var(--n-50);
  border-radius: var(--radio-tarjeta);
}

.inicio__bloque {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--esp-48);
  align-items: center;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: var(--esp-64) var(--esp-24);
}

.inicio__bloque--invertido { direction: rtl; }
.inicio__bloque--invertido > * { direction: ltr; }

.inicio__bloque-texto { display: flex; flex-direction: column; gap: var(--esp-12); }

.inicio__bloque-panel {
  padding: var(--esp-24);
  background-color: var(--n-100);
  border-radius: var(--radio-bloque);
}

.inicio__bloque-panel .tabla td,
.inicio__bloque-panel .tabla th { padding-left: 0; }

.stock-valor { font-weight: 500; font-variant-numeric: tabular-nums; }

.inicio__movimiento {
  display: flex;
  flex-direction: column;
  gap: var(--esp-8);
  padding: var(--esp-24);
  background-color: var(--superficie);
  border-radius: var(--radio-tarjeta);
}

.tipo-movimiento {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-4);
  font-size: 13px;
  color: var(--azul-500);
}

.inicio__movimiento-producto { font-size: 18px; font-weight: 500; }

.inicio__movimiento-linea {
  display: flex;
  align-items: baseline;
  gap: var(--esp-12);
  font-size: 32px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.inicio__movimiento-operacion { color: var(--texto-secundario); }

.inicio__preguntas { margin: 0; }

.inicio__pregunta {
  padding: var(--esp-16) 0;
  border-bottom: var(--borde-base);
}

.inicio__pregunta dt { font-weight: 500; margin-bottom: var(--esp-4); }
.inicio__pregunta dd { margin: 0; color: var(--texto-secundario); }

.inicio__cierre {
  display: flex;
  flex-direction: column;
  gap: var(--esp-16);
  padding: var(--esp-64) var(--esp-24) var(--esp-48);
  background-color: var(--azul-50);
}

@media (max-width: 768px) {
  .inicio__barra { padding: var(--esp-12) var(--esp-16); }
  .inicio__nav { display: none; }
  .inicio__hero { padding: var(--esp-32) var(--esp-16); }
  .inicio__hero h1 { font-size: 36px; }
  .inicio__seccion,
  .inicio__bloque { padding: var(--esp-32) var(--esp-16); grid-template-columns: minmax(0, 1fr); gap: var(--esp-24); }
  .inicio__bloque--invertido { direction: ltr; }
  .inicio__cierre { padding: var(--esp-32) var(--esp-16); }
  .inicio__vista-previa,
  .inicio__bloque-panel { padding: var(--esp-16); border-radius: var(--radio-tarjeta); }
}
</style>
