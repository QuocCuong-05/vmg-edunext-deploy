-- ============================================================
-- VMG EduNext — session-alive check (đá thiết bị đã bị revoke ngay khi chuyển trang)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

create or replace function public.session_alive(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists (
    select 1 from auth.refresh_tokens
    where session_id = p_session_id
  );
$$;

grant execute on function public.session_alive(uuid) to service_role;
