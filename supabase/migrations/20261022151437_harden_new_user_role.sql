-- Never auto-grant admin to a newly created auth user.
-- Previously the first user to sign up became admin, which is unsafe on an
-- empty project. Admin rights are now granted only explicitly.
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$function$;
