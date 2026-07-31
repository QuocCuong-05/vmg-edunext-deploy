-- ============================================================
-- VMG EduNext — Migration: RLS policies for community tables
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

-- community_posts
alter table public.community_posts enable row level security;
drop policy if exists "anon_select_community_posts" on public.community_posts;
create policy "anon_select_community_posts" on public.community_posts
  for select to anon, authenticated using (true);
drop policy if exists "authenticated_insert_community_posts" on public.community_posts;
create policy "authenticated_insert_community_posts" on public.community_posts
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "authenticated_update_community_posts" on public.community_posts;
create policy "authenticated_update_community_posts" on public.community_posts
  for update to authenticated using (user_id = auth.uid());
drop policy if exists "authenticated_delete_community_posts" on public.community_posts;
create policy "authenticated_delete_community_posts" on public.community_posts
  for delete to authenticated using (user_id = auth.uid());

-- community_likes
alter table public.community_likes enable row level security;
drop policy if exists "anon_select_community_likes" on public.community_likes;
create policy "anon_select_community_likes" on public.community_likes
  for select to anon, authenticated using (true);
drop policy if exists "authenticated_insert_community_likes" on public.community_likes;
create policy "authenticated_insert_community_likes" on public.community_likes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "authenticated_delete_community_likes" on public.community_likes;
create policy "authenticated_delete_community_likes" on public.community_likes
  for delete to authenticated using (user_id = auth.uid());

-- community_comments
alter table public.community_comments enable row level security;
drop policy if exists "anon_select_community_comments" on public.community_comments;
create policy "anon_select_community_comments" on public.community_comments
  for select to anon, authenticated using (true);
drop policy if exists "authenticated_insert_community_comments" on public.community_comments;
create policy "authenticated_insert_community_comments" on public.community_comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "authenticated_update_community_comments" on public.community_comments;
create policy "authenticated_update_community_comments" on public.community_comments
  for update to authenticated using (user_id = auth.uid());
drop policy if exists "authenticated_delete_community_comments" on public.community_comments;
create policy "authenticated_delete_community_comments" on public.community_comments
  for delete to authenticated using (user_id = auth.uid());

-- community_reports
alter table public.community_reports enable row level security;
drop policy if exists "anon_select_community_reports" on public.community_reports;
create policy "anon_select_community_reports" on public.community_reports
  for select to anon, authenticated using (true);
drop policy if exists "authenticated_insert_community_reports" on public.community_reports;
create policy "authenticated_insert_community_reports" on public.community_reports
  for insert to authenticated with check (user_id = auth.uid());

-- community_comment_reports
alter table public.community_comment_reports enable row level security;
drop policy if exists "anon_select_community_comment_reports" on public.community_comment_reports;
create policy "anon_select_community_comment_reports" on public.community_comment_reports
  for select to anon, authenticated using (true);
drop policy if exists "authenticated_insert_community_comment_reports" on public.community_comment_reports;
create policy "authenticated_insert_community_comment_reports" on public.community_comment_reports
  for insert to authenticated with check (user_id = auth.uid());
