create table if not exists public.news_archive (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null,
  source text,
  snippet text,
  image text,
  published_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_news_archive_published_at on public.news_archive (published_at desc);
create index if not exists idx_news_archive_first_seen_at on public.news_archive (first_seen_at desc);

alter table public.news_archive enable row level security;

create policy "Anyone can view news archive"
  on public.news_archive for select
  to anon, authenticated
  using (true);

create policy "Admins can insert news archive"
  on public.news_archive for insert
  to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update news archive"
  on public.news_archive for update
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete news archive"
  on public.news_archive for delete
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));