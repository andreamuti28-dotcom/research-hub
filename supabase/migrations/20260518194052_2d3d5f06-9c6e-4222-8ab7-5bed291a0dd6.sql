
-- Fix mutable search_path on trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lock down SECURITY DEFINER functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user_role() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

revoke execute on function public.increment_paper_views(text) from public;
revoke execute on function public.increment_paper_downloads(text) from public;
grant execute on function public.increment_paper_views(text) to anon, authenticated;
grant execute on function public.increment_paper_downloads(text) to anon, authenticated;
