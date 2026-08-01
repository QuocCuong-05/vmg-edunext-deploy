-- ============================================================
-- VMG EduNext — Migration: notifications realtime + siết RLS insert
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

-- 1) Bật realtime cho bảng notifications (idempotent)
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- 2) Siết quyền insert: chỉ authenticated, phải là người gửi, không tự gửi cho chính mình
drop policy if exists notifications_insert_service on public.notifications;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_insert_authenticated') then
    create policy notifications_insert_authenticated on public.notifications
      for insert to authenticated
      with check (from_user_id = auth.uid() and user_id <> auth.uid());
  end if;
end $$;
