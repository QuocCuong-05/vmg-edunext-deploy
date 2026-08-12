-- ============================================================
-- VMG EduNext — đăng xuất từng thiết bị (revoke theo session_id) + context event log
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- Lưu ý: chạy SAU migration_access_log.sql
-- ============================================================

-- session_id (lấy từ JWT claim của access token) để revoke chính xác từng thiết bị
alter table public.login_sessions add column session_id uuid;
alter table public.login_sessions drop column if exists token_hash;

-- RPC: hủy đúng session của 1 thiết bị (xóa refresh tokens theo session)
create or replace function public.revoke_session(p_session_id uuid)
returns void
language sql
security definer
set search_path = auth, public
as $$
  delete from auth.refresh_tokens where session_id = p_session_id;
$$;

grant execute on function public.revoke_session(uuid) to service_role;
drop function if exists public.revoke_session(uuid, text);

-- context cho event log (mẫu Uplearn: Bối cảnh của sự kiện)
alter table public.access_log add column context text;
