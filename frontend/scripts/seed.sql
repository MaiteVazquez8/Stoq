-- ============================================================================
-- Stoq · Datos de prueba (seed)
-- ============================================================================
-- Inserta datos controlados de prueba para desarrollo y demostración.
-- Los datos respetan las reglas de negocio y son coherentes entre sí.
--
-- ORDEN DE APLICACIÓN:
--   1. Aplicar primero frontend/scripts/db.sql
--   2. Crear las cuentas de autenticación de prueba en Supabase Auth
--      (administrador y operador) — por ejemplo registrando:
--        · lucia@casanube.com.ar  con metadata id_rol = 1 (Administrador)
--        · martin@casanube.com.ar con metadata id_rol = 2 (Operador)
--      El trigger handle_new_user crea automáticamente sus perfiles.
--   3. Aplicar este seed.sql
--
-- Los movimientos históricos se insertan directamente para que las
-- existencias iniciales del período ya queden consolidadas; el seed no
-- modifica stock_actual. Si la tabla de movimientos ya tiene registros,
-- los movimientos no se duplican.
-- ============================================================================

-- --- Roles ---
insert into public.roles (nombre, descripcion) values
  ('Administrador', 'Acceso completo: puede gestionar productos, categorías, consultar todo el inventario y registrar movimientos.'),
  ('Operador', 'Acceso acotado: puede consultar productos y registrar movimientos de entrada y salida.')
on conflict (nombre) do nothing;

-- --- Categorías ---
insert into public.categorias (nombre, descripcion, activo) values
  ('Velas', 'Velas aromáticas de soja y parafina.', true),
  ('Difusores', 'Difusores de ambiente con varillas.', true),
  ('Home sprays', 'Sprays y atomizadores de fragancia para el hogar.', true),
  ('Repuestos', 'Repuestos, mechas y recargas del catálogo.', true)
on conflict (nombre) do nothing;

-- --- Productos ---
-- Las existencias finales reflejan los movimientos históricos del seed.
insert into public.productos (codigo, nombre, descripcion, id_categoria, unidad_medida, precio, stock_actual, stock_minimo, fecha_creacion, activo)
select p.codigo, p.nombre, p.descripcion, c.id_categoria, p.unidad_medida, p.precio, p.stock_actual, p.stock_minimo, p.fecha_creacion::date, p.activo
from (values
  ('VEL-001', 'Vela de soja · Ámbar', 'Vela de soja de 200 g. Aroma ámbar. Frasco de vidrio.', 'Velas', 'Unidad', 4500.00, 84, 20, '2026-09-01', true),
  ('VEL-002', 'Vela de soja · Lino', 'Vela de soja de 200 g. Aroma lino. Frasco de vidrio.', 'Velas', 'Unidad', 4500.00, 56, 20, '2026-09-01', true),
  ('VEL-003', 'Vela de soja · Canela', 'Vela de soja de 200 g. Aroma canela. Frasco de vidrio.', 'Velas', 'Unidad', 4700.00, 30, 12, '2026-09-22', true),
  ('DIF-001', 'Difusor · Bosque', 'Difusor de ambiente de 250 ml con varillas de mimbre.', 'Difusores', 'Unidad', 8900.00, 42, 12, '2026-09-05', true),
  ('DIF-002', 'Difusor · Cítrico', 'Difusor de ambiente de 250 ml con varillas de mimbre.', 'Difusores', 'Unidad', 8900.00, 18, 20, '2026-09-05', true),
  ('SPR-001', 'Home spray · Bruma', 'Home spray de 100 ml. Aroma bruma y eucalipto.', 'Home sprays', 'Unidad', 5200.00, 8, 10, '2026-09-12', true),
  ('SPR-002', 'Home spray · Cedro', 'Home spray de 100 ml. Aroma cedro y vetiver.', 'Home sprays', 'Unidad', 5200.00, 0, 10, '2026-09-12', true),
  ('REP-001', 'Repuesto de mecha', 'Kit de repuesto: mecha de algodón y soporte metálico.', 'Repuestos', 'Pack', 1900.00, 24, 8, '2026-09-28', true)
) as p(codigo, nombre, descripcion, categoria, unidad_medida, precio, stock_actual, stock_minimo, fecha_creacion, activo)
join public.categorias c on c.nombre = p.categoria
on conflict (codigo) do nothing;

-- --- Movimientos históricos (solo si la tabla está vacía) ---
do $$
declare
  v_lucia uuid;
  v_martin uuid;
begin
  select id_usuario into v_lucia from public.usuarios where email = 'lucia@casanube.com.ar';
  select id_usuario into v_martin from public.usuarios where email = 'martin@casanube.com.ar';

  if v_lucia is null or v_martin is null then
    raise notice 'Movimientos semilla omitidos: faltan los perfiles de lucia@casanube.com.ar / martin@casanube.com.ar en public.usuarios. Creá las cuentas en Supabase Auth y volvé a ejecutar el seed.';
  elsif (select count(*) from public.movimientos) > 0 then
    raise notice 'Movimientos semilla omitidos: la tabla movimientos ya contiene registros.';
  else
    insert into public.movimientos (id_producto, id_usuario, tipo_movimiento, cantidad, fecha_hora, motivo, observacion) values
      ((select id_producto from public.productos where codigo = 'REP-001'), v_lucia,  'Entrada', 7,  '2026-10-22 09:20:00-03', 'Entrada de proveedor', 'Primera tanda de la orden de compra 1042.'),
      ((select id_producto from public.productos where codigo = 'REP-001'), v_lucia,  'Entrada', 5,  '2026-10-22 11:40:00-03', 'Entrada de proveedor', 'Segunda tanda de la orden de compra 1042.'),
      ((select id_producto from public.productos where codigo = 'VEL-001'), v_martin, 'Salida',  8,  '2026-10-23 12:15:00-03', 'Entrega de pedidos',   'Pedido mayorista 231.'),
      ((select id_producto from public.productos where codigo = 'DIF-001'), v_lucia,  'Entrada', 10, '2026-10-24 10:05:00-03', 'Producción terminada', 'Lote de difusores Bosque.'),
      ((select id_producto from public.productos where codigo = 'DIF-001'), v_lucia,  'Entrada', 6,  '2026-10-24 15:30:00-03', 'Producción terminada', 'Segunda tanda del lote.'),
      ((select id_producto from public.productos where codigo = 'DIF-002'), v_martin, 'Salida',  2,  '2026-10-24 17:20:00-03', 'Entrega de pedidos',   'Pedido minorista 118.'),
      ((select id_producto from public.productos where codigo = 'DIF-002'), v_martin, 'Salida',  2,  '2026-10-24 18:05:00-03', 'Entrega de pedidos',   'Pedido minorista 119.'),
      ((select id_producto from public.productos where codigo = 'VEL-002'), v_lucia,  'Entrada', 12, '2026-10-25 11:05:00-03', 'Producción terminada', 'Lote de velas Lino.'),
      ((select id_producto from public.productos where codigo = 'SPR-001'), v_martin, 'Salida',  3,  '2026-10-25 16:40:00-03', 'Entrega de pedidos',   'Pedido minorista 124.'),
      ((select id_producto from public.productos where codigo = 'VEL-001'), v_martin, 'Salida',  8,  '2026-10-26 11:00:00-03', 'Entrega de pedidos',   'Pedido mayorista 236.'),
      ((select id_producto from public.productos where codigo = 'DIF-002'), v_martin, 'Salida',  6,  '2026-10-26 16:20:00-03', 'Entrega de pedidos',   'Pedido minorista 131.'),
      ((select id_producto from public.productos where codigo = 'SPR-001'), v_martin, 'Salida',  4,  '2026-10-26 17:40:00-03', 'Entrega de pedidos',   'Pedido minorista 132.'),
      ((select id_producto from public.productos where codigo = 'SPR-002'), v_martin, 'Salida',  5,  '2026-10-27 09:15:00-03', 'Entrega de pedidos',   'Últimas unidades del aroma cedro.'),
      ((select id_producto from public.productos where codigo = 'VEL-001'), v_lucia,  'Entrada', 24, '2026-10-27 10:30:00-03', 'Producción terminada', 'Lote grande para la próxima temporada.');
  end if;
end $$;

-- ============================================================================
-- Fin del seed
-- ============================================================================
