-- ============================================================
-- VMG EduNext — đăng xuất từng thiết bị + context event log
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- Lưu ý: chạy SAU migration_access_log.sql
-- ============================================================

-- token hash (SHA-256 của refresh token — khớp cột auth.refresh_tokens.token)
alter table public.login_sessions add column token_hash text;

-- RPC: xóa đúng refresh token của 1 thiết bị (revoke chính xác)
create or replace function public.revoke_session(p_user_id uuid, p_token_hash text)
returns void
language sql
security definer
set search_path = auth, public
as $$
  delete from auth.refresh_tokens
  where user_id = p_user_id::text and token = p_token_hash;
$$;

grant execute on function public.revoke_session(uuid, text) to service_role;

-- context cho event log (mẫu Uplearn: Bối cảnh của sự kiện)
alter table public.access_log add column context text;
