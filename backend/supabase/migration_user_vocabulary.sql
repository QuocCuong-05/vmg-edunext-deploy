-- ============================================================
-- VMG EduNext — Migration: user_vocabulary
-- Bảng liên kết user <-> vocabulary_entries (Sổ từ)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

create table if not exists public.user_vocabulary (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  vocabulary_entry_id uuid not null references public.vocabulary_entries(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique(user_id, vocabulary_entry_id)
);

create index if not exists idx_uvocab_user on public.user_vocabulary(user_id);
create index if not exists idx_uvocab_entry on public.user_vocabulary(vocabulary_entry_id);

alter table public.user_vocabulary enable row level security;

drop policy if exists "manage_own_user_vocabulary" on public.user_vocabulary;
create policy "manage_own_user_vocabulary" on public.user_vocabulary
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
