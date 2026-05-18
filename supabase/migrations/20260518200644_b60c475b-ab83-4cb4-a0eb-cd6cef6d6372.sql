
-- Site settings singleton
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  name text not null default 'Andrea Muti',
  hero_title text not null default 'Esplorando l''intersezione tra Etica Digitale e Infrastrutture.',
  hero_intro text not null default 'Sono un ricercatore indipendente basato a Milano. Mi occupo di come le architetture software influenzano il comportamento sociale. Questo spazio è il mio archivio di paper, saggi e riflessioni tecniche.',
  linkedin_url text not null default 'https://www.linkedin.com',
  portrait_url text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton_check check (singleton = true)
);

alter table public.site_settings enable row level security;

create policy "Anyone can view site settings"
on public.site_settings for select
to anon, authenticated
using (true);

create policy "Admins can insert site settings"
on public.site_settings for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site settings"
on public.site_settings for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (singleton) values (true);

-- Public bucket for site assets (profile photo, etc.)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "Public read site-assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-assets');

create policy "Admins upload site-assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update site-assets"
on storage.objects for update
to authenticated
using (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete site-assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));
