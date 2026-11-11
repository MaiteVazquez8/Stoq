-- ============================================================================
-- Stoq · Migración 2: Proveedores y reposiciones (RF13)
-- ============================================================================
-- Crea las entidades Proveedor y Reposición según el modelo de la Etapa 3.
-- Base: la migración inicial (db.sql) debe estar aplicada primero.
-- Idempotente: puede volver a ejecutarse sin duplicar nada.
--
-- Modelo (Etapa 3):
--   · Proveedor: datos de la persona/empresa que suministra mercadería.
--   · Reposición: operación de reposición vinculada opcionales a un proveedor,
--     con estado pendiente/recibida y una lista de productos esperados.
--   · reposicion_productos: detalle de cada reposición (producto + cantidad).
--
-- Permisos: administrador únicamente (matriz de la Etapa 3: “Administrador”
-- en todas las operaciones; el operador no participa).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla: proveedores
-- ----------------------------------------------------------------------------
create table if not exists public.proveedores (
  id_proveedor integer primary key generated always as identity,
  nombre_razon_social text not null check (char_length(trim(nombre_razon_social)) > 0),
  telefono text,
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  direccion text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_proveedores_nombre_unico
  on public.proveedores (lower(trim(nombre_razon_social)));

-- ----------------------------------------------------------------------------
-- 2. Tabla: reposiciones
-- ----------------------------------------------------------------------------
create table if not exists public.reposiciones (
  id_reposicion integer primary key generated always as identity,
  id_proveedor integer references public.proveedores(id_proveedor) on delete restrict,
  fecha date not null default current_date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'recibida')),
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reposiciones_proveedor on public.reposiciones(id_proveedor);
create index if not exists idx_reposiciones_estado on public.reposiciones(estado);
create index if not exists idx_reposiciones_fecha on public.reposiciones(fecha);

-- ----------------------------------------------------------------------------
-- 3. Tabla: detalle de reposición (producto + cantidad esperada)
-- ----------------------------------------------------------------------------
create table if not exists public.reposicion_productos (
  id_reposicion integer not null references public.reposiciones(id_reposicion) on delete cascade,
  id_producto integer not null references public.productos(id_producto) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  primary key (id_reposicion, id_producto)
);

create index if not exists idx_reposicion_productos_producto on public.reposicion_productos(id_producto);

-- ----------------------------------------------------------------------------
-- 4. updated_at automático
-- ----------------------------------------------------------------------------
drop trigger if exists trg_proveedores_updated_at on public.proveedores;
create trigger trg_proveedores_updated_at
  before update on public.proveedores
  for each row execute function public.tocar_updated_at();

drop trigger if exists trg_reposiciones_updated_at on public.reposiciones;
create trigger trg_reposiciones_updated_at
  before update on public.reposiciones
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Habilitar RLS
-- ----------------------------------------------------------------------------
alter table public.proveedores enable row level security;
alter table public.reposiciones enable row level security;
alter table public.reposicion_productos enable row level security;

-- ----------------------------------------------------------------------------
-- 6. Políticas RLS: solo administrador (matriz de permisos de la Etapa 3)
-- ----------------------------------------------------------------------------
drop policy if exists "Proveedores: solo admin" on public.proveedores;
create policy "Proveedores: solo admin" on public.proveedores
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

drop policy if exists "Reposiciones: solo admin" on public.reposiciones;
create policy "Reposiciones: solo admin" on public.reposiciones
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

drop policy if exists "Detalle reposiciones: solo admin" on public.reposicion_productos;
create policy "Detalle reposiciones: solo admin" on public.reposicion_productos
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- ----------------------------------------------------------------------------
-- 7. Función RPC: eliminar_proveedor (fail-safe con relaciones)
--    Borra solo si no existen reposiciones asociadas; la UI ya lo pre-chequea.
-- ----------------------------------------------------------------------------
create or replace function public.eliminar_proveedor(
  p_id_proveedor integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_administrador() then
    return json_build_object('success', false, 'error', 'Tu perfil no tiene permiso para eliminar proveedores.');
  end if;

  if exists (select 1 from public.reposiciones where id_proveedor = p_id_proveedor) then
    return json_build_object('success', false, 'error', 'El proveedor tiene reposiciones asociadas. Eliminá primero las reposiciones o conservá el proveedor.');
  end if;

  delete from public.proveedores where id_proveedor = p_id_proveedor;

  if not found then
    return json_build_object('success', false, 'error', 'El proveedor no existe.');
  end if;

  return json_build_object('success', true, 'message', 'Proveedor eliminado.');
end;
$$;

revoke all on function public.eliminar_proveedor(integer) from public, anon;
grant execute on function public.eliminar_proveedor(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Vista: reposiciones con proveedor y detalle de productos
-- ----------------------------------------------------------------------------
create or replace view public.vw_reposiciones_detalle
with (security_invoker = true) as
select
  r.id_reposicion,
  r.id_proveedor,
  p.nombre_razon_social as proveedor_nombre,
  r.fecha,
  r.estado,
  r.observacion,
  r.created_at,
  coalesce(sum(rp.cantidad), 0) as total_unidades,
  count(rp.id_producto) as total_productos
from public.reposiciones r
left join public.proveedores p on p.id_proveedor = r.id_proveedor
left join public.reposicion_productos rp on rp.id_reposicion = r.id_reposicion
group by r.id_reposicion, r.id_proveedor, p.nombre_razon_social, r.fecha, r.estado, r.observacion, r.created_at;

-- ============================================================================
-- Fin de la migración
-- ============================================================================
