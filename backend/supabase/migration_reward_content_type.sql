-- ============================================================
-- VMG EduNext — mở rộng enum reward_content_type cho hệ thống phần thưởng v2
-- (badge / sticker / theme / certificate / frame / title / retry / boost / voucher)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- Lưu ý: chạy TRƯỚC khi import rewards v2
-- ============================================================

alter type public.reward_content_type rename to reward_content_type_old;

create type public.reward_content_type as enum (
  'digital_badge',
  'sticker_pack',
  'theme',
  'certificate_skin',
  'avatar_frame',
  'profile_title',
  'quiz_retry',
  'xp_boost',
  'expert_voucher',
  'coaching_voucher'
);

alter table public.rewards
  alter column content_type type public.reward_content_type
  using content_type::text::public.reward_content_type;

drop type public.reward_content_type_old;
