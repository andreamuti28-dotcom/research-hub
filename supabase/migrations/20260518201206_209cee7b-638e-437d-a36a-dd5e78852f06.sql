
-- 1) Remove broad public SELECT policies on storage.objects.
-- Files in public buckets remain reachable via their public CDN URL
-- (which bypasses RLS), but anonymous listing is no longer possible.
drop policy if exists "Public read site-assets" on storage.objects;

-- Drop equivalent broad policies on the papers bucket (name may vary).
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'SELECT'
      and qual ilike '%bucket_id = ''papers''%'
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end$$;

-- 2) Lock down internal helper functions: revoke EXECUTE from public roles.
-- These are only called from RLS / triggers (which run as function owner),
-- so revoking does not break anything.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user_role() from public, anon, authenticated;

-- 3) Increment functions are intentionally callable by anon (page views/downloads).
-- Make the grants explicit and re-affirm the security boundary.
revoke execute on function public.increment_paper_views(text) from public;
revoke execute on function public.increment_paper_downloads(text) from public;
grant execute on function public.increment_paper_views(text) to anon, authenticated;
grant execute on function public.increment_paper_downloads(text) to anon, authenticated;
