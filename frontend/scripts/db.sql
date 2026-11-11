-- ============================================================================
-- Stoq Â· Base de datos Supabase (migraciÃ³n inicial, versiÃ³n corregida)
-- ============================================================================
-- Este script crea las tablas necesarias para el sistema de gestiÃ³n de stock
-- de Stoq, aplicando Row Level Security (RLS), constraints de integridad,
-- disparadores de sincronizaciÃ³n con Supabase Auth y funciones RPC para las
-- operaciones atÃ³micas de stock.
--
-- âœ… Estado: aplicado y verificado en la Etapa 5 (base inicialmente vacÃ­a).
--    La versiÃ³n preliminar de este archivo nunca llegÃ³ a aplicarse; el esquema
--    final quedÃ³ alineado con Supabase Auth aprovechando que no existÃ­a
--    ningÃºn dato ni tabla creada todavÃ­a.
--
-- Modelo de integraciÃ³n con Auth:
--   Â· auth.users (gestionado por Supabase Auth) guarda las credenciales.
--   Â· public.usuarios (este esquema) guarda el perfil de aplicaciÃ³n:
--     nombre, email, id_rol y estado. id_usuario es el mismo UUID de auth.users.
--   Â· Un trigger (handle_new_user) crea el perfil automÃ¡ticamente al
--     registrarse una cuenta en Auth.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla: roles
-- ----------------------------------------------------------------------------
create table if not exists public.roles (
  id_rol integer primary key generated always as identity,
  nombre text not null unique check (char_length(nombre) > 0),
  descripcion text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: usuarios (perfil de aplicaciÃ³n, vinculado a auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios (
  id_usuario uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) > 0),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  id_rol integer not null references public.roles(id_rol) on delete restrict,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Tabla: categorias
-- ----------------------------------------------------------------------------
create table if not exists public.categorias (
  id_categoria integer primary key generated always as identity,
  nombre text not null unique check (char_length(trim(nombre)) > 0),
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Tabla: productos
-- ----------------------------------------------------------------------------
create table if not exists public.productos (
  id_producto integer primary key generated always as identity,
  codigo text not null unique check (codigo ~* '^[A-Za-z0-9][A-Za-z0-9-]*$'),
  nombre text not null check (char_length(trim(nombre)) >= 2),
  descripcion text,
  id_categoria integer not null references public.categorias(id_categoria) on delete restrict,
  unidad_medida text not null check (unidad_medida in ('Unidad', 'Pack', 'Caja')),
  precio numeric(12, 2) not null check (precio > 0),
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  fecha_creacion date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. Tabla: movimientos de stock
-- ----------------------------------------------------------------------------
create table if not exists public.movimientos (
  id_movimiento integer primary key generated always as identity,
  id_producto integer not null references public.productos(id_producto) on delete restrict,
  id_usuario uuid not null references public.usuarios(id_usuario) on delete restrict,
  tipo_movimiento text not null check (tipo_movimiento in ('Entrada', 'Salida')),
  cantidad integer not null check (cantidad > 0),
  fecha_hora timestamptz not null default now(),
  motivo text not null check (char_length(trim(motivo)) > 0),
  observacion text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Ãndices para consultas frecuentes
-- ----------------------------------------------------------------------------
create index if not exists idx_productos_categoria on public.productos(id_categoria);
create index if not exists idx_productos_codigo on public.productos(codigo);
create index if not exists idx_productos_activo on public.productos(activo);
create index if not exists idx_movimientos_producto on public.movimientos(id_producto);
create index if not exists idx_movimientos_usuario on public.movimientos(id_usuario);
create index if not exists idx_movimientos_fecha on public.movimientos(fecha_hora);
create index if not exists idx_movimientos_tipo on public.movimientos(tipo_movimiento);
create index if not exists idx_usuarios_rol on public.usuarios(id_rol);
create index if not exists idx_usuarios_email on public.usuarios(email);

-- ----------------------------------------------------------------------------
-- 6. Funciones auxiliares de autorizaciÃ³n (evitan recursiÃ³n en RLS)
-- ----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select id_rol from public.usuarios
  where id_usuario = auth.uid() and estado = 'activo'
$$;

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.rol_actual() = 1, false)
$$;

create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() is not null
$$;

-- ----------------------------------------------------------------------------
-- 7. Disparador: crear el perfil al registrar un usuario en Auth
--    Los datos del perfil vienen de raw_user_meta_data (nombre, id_rol).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id_usuario, nombre, email, id_rol, estado)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'id_rol')::integer, 2),
    'activo'
  )
  on conflict (id_usuario) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 8. Disparador: mantener updated_at actualizado
-- ----------------------------------------------------------------------------
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.tocar_updated_at();

drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Disparador: impedir borrar categorÃ­as con productos asociados
-- ----------------------------------------------------------------------------
create or replace function public.impedir_borrado_categoria_con_productos()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.productos where id_categoria = old.id_categoria) then
    raise exception 'No se puede eliminar la categorÃ­a porque tiene productos asociados.'
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_categorias_sin_productos on public.categorias;
create trigger trg_categorias_sin_productos
  before delete on public.categorias
  for each row execute function public.impedir_borrado_categoria_con_productos();

-- ----------------------------------------------------------------------------
-- 10. Row Level Security: limpieza idempotente + habilitaciÃ³n
--     Elimina TODAS las polÃ­ticas previas sobre las tablas de Stoq (tanto de
--     borradores anteriores como de corridas repetidas de este script).
-- ----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('roles', 'usuarios', 'categorias', 'productos', 'movimientos')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

alter table public.roles enable row level security;
alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.movimientos enable row level security;

-- ----------------------------------------------------------------------------
-- 11. PolÃ­ticas RLS â€” Roles (lectura para usuarios con sesiÃ³n, escritura admin)
-- ----------------------------------------------------------------------------
create policy "Roles: lectura del sistema" on public.roles
  for select to authenticated using (true);

create policy "Roles: escritura solo admin" on public.roles
  for all to authenticated using (public.es_administrador()) with check (public.es_administrador());

-- ----------------------------------------------------------------------------
-- 12. PolÃ­ticas RLS â€” Usuarios (lectura para autenticados, escritura admin)
-- ----------------------------------------------------------------------------
create policy "Usuarios: lectura autenticados" on public.usuarios
  for select to authenticated using (true);

create policy "Usuarios: alta solo admin" on public.usuarios
  for insert to authenticated
  with check (public.es_administrador() or id_usuario = auth.uid());

create policy "Usuarios: ediciÃ³n solo admin" on public.usuarios
  for update to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());
-- Sin polÃ­tica de borrado: las cuentas se conservan desactivadas (estado).

-- ----------------------------------------------------------------------------
-- 13. PolÃ­ticas RLS â€” CategorÃ­as (lectura autenticados, escritura admin)
-- ----------------------------------------------------------------------------
create policy "CategorÃ­as: lectura autenticados" on public.categorias
  for select to authenticated using (true);

create policy "CategorÃ­as: inserciÃ³n solo admin" on public.categorias
  for insert to authenticated
  with check (public.es_administrador());

create policy "CategorÃ­as: actualizaciÃ³n solo admin" on public.categorias
  for update to authenticated
  using (public.es_administrador()) with check (public.es_administrador());

create policy "CategorÃ­as: borrado solo admin sin productos" on public.categorias
  for delete to authenticated
  using (public.es_administrador());

-- ----------------------------------------------------------------------------
-- 14. PolÃ­ticas RLS â€” Productos (lectura autenticados, escritura admin)
-- ----------------------------------------------------------------------------
create policy "Productos: lectura autenticados" on public.productos
  for select to authenticated using (true);

create policy "Productos: inserciÃ³n solo admin" on public.productos
  for insert to authenticated
  with check (public.es_administrador());

create policy "Productos: actualizaciÃ³n solo admin" on public.productos
  for update to authenticated
  using (public.es_administrador()) with check (public.es_administrador());

create policy "Productos: borrado solo admin" on public.productos
  for delete to authenticated
  using (public.es_administrador());

-- ----------------------------------------------------------------------------
-- 15. PolÃ­ticas RLS â€” Movimientos (lectura autenticados; SIN escritura directa)
--     Los movimientos solo se crean a travÃ©s del RPC registrar_movimiento,
--     que garantiza atomicidad (stock + historial) y trazabilidad.
--     No existen polÃ­ticas de UPDATE ni DELETE: el historial es inmutable.
-- ----------------------------------------------------------------------------
create policy "Movimientos: lectura autenticados" on public.movimientos
  for select to authenticated using (public.usuario_activo());

-- ----------------------------------------------------------------------------
-- 16. FunciÃ³n RPC: registrar_movimiento (operaciÃ³n atÃ³mica de stock)
--     Â· El usuario responsable es SIEMPRE el autenticado (auth.uid()).
--     Â· Bloquea la fila del producto (FOR UPDATE) para evitar condiciones
--       de carrera entre operaciones concurrentes.
-- ----------------------------------------------------------------------------
create or replace function public.registrar_movimiento(
  p_id_producto integer,
  p_tipo_movimiento text,
  p_cantidad integer,
  p_motivo text,
  p_observacion text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_stock_actual integer;
  v_stock_nuevo integer;
  v_id_movimiento integer;
begin
  -- Validar que quien llama tenga un perfil de usuario activo
  if v_usuario is null or not public.usuario_activo() then
    return json_build_object('success', false, 'error', 'Tu perfil no tiene permiso para registrar movimientos.');
  end if;

  -- Validar tipo de movimiento
  if p_tipo_movimiento not in ('Entrada', 'Salida') then
    return json_build_object('success', false, 'error', 'Tipo de movimiento invÃ¡lido.');
  end if;

  -- Validar cantidad (entero positivo, RN04)
  if p_cantidad is null or p_cantidad <= 0 then
    return json_build_object('success', false, 'error', 'La cantidad debe ser un entero mayor a 0.');
  end if;

  -- Validar motivo (RN12)
  if p_motivo is null or char_length(trim(p_motivo)) = 0 then
    return json_build_object('success', false, 'error', 'El motivo del movimiento es obligatorio.');
  end if;

  -- Bloquear la fila del producto para obtener el stock consistente
  select stock_actual into v_stock_actual
  from public.productos
  where id_producto = p_id_producto
  for update;

  if v_stock_actual is null then
    return json_build_object('success', false, 'error', 'El producto no existe.');
  end if;

  -- Solo se opera sobre productos activos (RN: productos inactivos fuera de operaciones)
  if not (select activo from public.productos where id_producto = p_id_producto) then
    return json_build_object('success', false, 'error', 'El producto estÃ¡ inactivo. No se pueden registrar movimientos.');
  end if;

  -- Validar salida contra stock disponible (RN05 / RF06)
  if p_tipo_movimiento = 'Salida' and p_cantidad > v_stock_actual then
    return json_build_object(
      'success', false,
      'error', 'Stock insuficiente. Disponible: ' || v_stock_actual || '.',
      'stock_disponible', v_stock_actual
    );
  end if;

  -- Calcular nuevo stock (RN07)
  if p_tipo_movimiento = 'Entrada' then
    v_stock_nuevo := v_stock_actual + p_cantidad;
  else
    v_stock_nuevo := v_stock_actual - p_cantidad;
  end if;

  -- Actualizar stock del producto (RN07)
  update public.productos
  set stock_actual = v_stock_nuevo
  where id_producto = p_id_producto;

  -- Insertar movimiento con el usuario responsable autenticado (RN06)
  insert into public.movimientos (
    id_producto, id_usuario, tipo_movimiento, cantidad, fecha_hora, motivo, observacion
  ) values (
    p_id_producto, v_usuario, p_tipo_movimiento, p_cantidad, now(), trim(p_motivo), nullif(trim(coalesce(p_observacion, '')), '')
  )
  returning id_movimiento into v_id_movimiento;

  return json_build_object(
    'success', true,
    'id_movimiento', v_id_movimiento,
    'id_producto', p_id_producto,
    'tipo_movimiento', p_tipo_movimiento,
    'cantidad', p_cantidad,
    'stock_anterior', v_stock_actual,
    'stock_nuevo', v_stock_nuevo
  );

-- RN08: si algo falla, ninguna de las dos operaciones queda aplicada.
exception when others then
  return json_build_object(
    'success', false,
    'error', 'Error interno al registrar el movimiento: ' || sqlerrm()
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 17. FunciÃ³n RPC: desactivar_producto (baja lÃ³gica, solo administrador)
-- ----------------------------------------------------------------------------
create or replace function public.desactivar_producto(
  p_id_producto integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tiene_movimientos boolean;
  v_activo boolean;
begin
  if not public.es_administrador() then
    return json_build_object('success', false, 'error', 'Tu perfil no tiene permiso para desactivar productos.');
  end if;

  select activo into v_activo
  from public.productos
  where id_producto = p_id_producto;

  if v_activo is null then
    return json_build_object('success', false, 'error', 'El producto no existe.');
  end if;

  if not v_activo then
    return json_build_object('success', false, 'error', 'El producto ya estÃ¡ inactivo.');
  end if;

  select exists (
    select 1 from public.movimientos where id_producto = p_id_producto
  ) into v_tiene_movimientos;

  if v_tiene_movimientos then
    -- Baja lÃ³gica: conservar el historial de movimientos (RN10)
    update public.productos
    set activo = false
    where id_producto = p_id_producto;

    return json_build_object('success', true, 'message', 'Producto desactivado. El historial de movimientos se conserva.');
  else
    -- Sin historial: se permite el borrado fÃ­sico controlado
    delete from public.productos where id_producto = p_id_producto;
    return json_build_object('success', true, 'message', 'Producto eliminado. No tenÃ­a movimientos asociados.');
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 18. FunciÃ³n RPC: activar_producto (revertir baja lÃ³gica, solo administrador)
-- ----------------------------------------------------------------------------
create or replace function public.activar_producto(
  p_id_producto integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_administrador() then
    return json_build_object('success', false, 'error', 'Tu perfil no tiene permiso para reactivar productos.');
  end if;

  update public.productos
  set activo = true
  where id_producto = p_id_producto and activo = false;

  if not found then
    return json_build_object('success', false, 'error', 'El producto no existe o ya estaba activo.');
  end if;

  return json_build_object('success', true, 'message', 'Producto reactivado.');
end;
$$;

-- ----------------------------------------------------------------------------
-- Permisos de ejecuciÃ³n de las funciones RPC
-- ----------------------------------------------------------------------------
revoke all on function public.registrar_movimiento(integer, text, integer, text, text) from public, anon;
revoke all on function public.desactivar_producto(integer) from public, anon;
revoke all on function public.activar_producto(integer) from public, anon;
grant execute on function public.registrar_movimiento(integer, text, integer, text, text) to authenticated;
grant execute on function public.desactivar_producto(integer) to authenticated;
grant execute on function public.activar_producto(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 19. Vista: movimientos con datos relacionados (para consultas eficientes)
--     Incluye saldo_resultante: existencias del producto DESPUÃ‰S de ese
--     movimiento (saldo implÃ­cito de apertura = stock_actual âˆ’ total firmado
--     histÃ³rico). Se calcula en la base para que el historial y el detalle
--     muestren el saldo sin lÃ³gica adicional en el cliente.
-- ----------------------------------------------------------------------------
create or replace view public.vw_movimientos_detalle
with (security_invoker = true) as
with firmados as (
  select
    m.*,
    case when m.tipo_movimiento = 'Entrada' then m.cantidad else -m.cantidad end as signed
  from public.movimientos m
)
select
  f.id_movimiento,
  f.id_producto,
  p.codigo as producto_codigo,
  p.nombre as producto_nombre,
  f.id_usuario,
  u.nombre as usuario_nombre,
  f.tipo_movimiento,
  f.cantidad,
  f.fecha_hora,
  f.motivo,
  f.observacion,
  p.stock_actual - sum(f.signed) over (partition by f.id_producto)
    + sum(f.signed) over (partition by f.id_producto order by f.fecha_hora, f.id_movimiento) as saldo_resultante
from firmados f
join public.productos p on p.id_producto = f.id_producto
join public.usuarios u on u.id_usuario = f.id_usuario;

-- ----------------------------------------------------------------------------
-- 20. Vista: resumen de inventario por producto
-- ----------------------------------------------------------------------------
create or replace view public.vw_productos_resumen
with (security_invoker = true) as
select
  p.id_producto,
  p.codigo,
  p.nombre,
  p.descripcion,
  p.id_categoria,
  c.nombre as categoria_nombre,
  p.unidad_medida,
  p.precio,
  p.stock_actual,
  p.stock_minimo,
  p.fecha_creacion,
  p.activo,
  case
    when p.stock_actual <= 0 then 'agotado'
    when p.stock_actual < p.stock_minimo then 'bajo'
    else 'suficiente'
  end as estado_stock
from public.productos p
join public.categorias c on c.id_categoria = p.id_categoria;

-- ============================================================================
-- Fin de la migraciÃ³n
-- ============================================================================
