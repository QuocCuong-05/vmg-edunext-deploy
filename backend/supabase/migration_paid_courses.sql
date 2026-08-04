-- Khóa trả phí + đơn hàng + mã kích hoạt + cấu hình
-- Chạy 1 lần trên SQL Editor (staging + production)

-- Enum access_type cho khóa học
do $$ begin
  create type public.course_access_type as enum ('free','paid');
exception when duplicate_object then null; end $$;

alter table public.courses add column if not exists access_type public.course_access_type not null default 'free';
alter table public.courses add column if not exists price integer;
alter table public.courses add column if not exists sale_price integer;

-- Đoạn xem trước cho bài học
alter table public.lessons add column if not exists preview_text text;

-- Đơn hàng
do $$ begin
  create type public.order_method as enum ('bank_transfer','code','payoo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_status as enum ('pending','paid','failed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  order_no     text not null unique,
  user_id      uuid not null references auth.users(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  amount       integer not null,
  method       public.order_method not null default 'bank_transfer',
  status       public.order_status not null default 'pending',
  expires_at   timestamptz,
  confirmed_by uuid references auth.users(id),
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_orders_user   on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_course on public.orders(course_id);

-- Mã kích hoạt (user KHÔNG đọc được — chỉ service role)
create table if not exists public.activation_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  course_id  uuid references public.courses(id) on delete cascade,
  max_uses   integer not null default 1,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active  boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_activation_codes_course on public.activation_codes(course_id);

-- Cấu hình chung (QR chuyển khoản, thời gian đơn...)
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.orders enable row level security;
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (user_id = auth.uid());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());

alter table public.activation_codes enable row level security;
-- không policy nào: user không đọc được mã

alter table public.app_settings enable row level security;
drop policy if exists "app_settings_select" on public.app_settings;
create policy "app_settings_select" on public.app_settings
  for select using (true);

-- Cấu hình mặc định
insert into public.app_settings (key, value) values
  ('order_ttl_minutes', '10'::jsonb),
  ('bank_transfer', '{"bank_name":"","account_number":"","account_holder":"","content_prefix":"VMG"}'::jsonb)
on conflict (key) do nothing;
