
-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- Grant admin to first user, regular user otherwise
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_role();

-- Papers table
create table public.papers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  abstract text not null,
  content text not null default '',
  tags text[] not null default '{}',
  pdf_url text,
  published_date date not null default current_date,
  is_published boolean not null default true,
  views integer not null default 0,
  downloads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.papers enable row level security;

create policy "Anyone can view published papers"
  on public.papers for select to anon, authenticated
  using (is_published = true);

create policy "Admins can view all papers"
  on public.papers for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert papers"
  on public.papers for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update papers"
  on public.papers for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete papers"
  on public.papers for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index papers_published_date_idx on public.papers (published_date desc);
create index papers_tags_idx on public.papers using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger papers_set_updated_at
  before update on public.papers
  for each row execute function public.set_updated_at();

-- Public counter increments
create or replace function public.increment_paper_views(_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.papers set views = views + 1
  where slug = _slug and is_published = true;
$$;

create or replace function public.increment_paper_downloads(_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.papers set downloads = downloads + 1
  where slug = _slug and is_published = true;
$$;

grant execute on function public.increment_paper_views(text) to anon, authenticated;
grant execute on function public.increment_paper_downloads(text) to anon, authenticated;

-- Seed
insert into public.papers (slug, title, abstract, content, tags, published_date, views, downloads) values
('illusione-decentralizzazione-mesh',
 'L''illusione della decentralizzazione nelle reti Mesh',
 'Un''analisi critica sulle topologie di rete emergenti e la loro reale capacità di resistere al consolidamento del potere corporativo.',
 E'Le reti mesh sono state a lungo presentate come il rimedio strutturale al consolidamento del potere nelle infrastrutture digitali. Eppure, dietro la promessa topologica, emergono dinamiche economiche e cognitive che riproducono — talvolta amplificano — le stesse asimmetrie che dovrebbero risolvere.\n\nIn questo paper analizziamo tre casi studio (Helium, NYC Mesh, Guifi.net) ed evidenziamo come la decentralizzazione tecnica non implichi automaticamente decentralizzazione del potere. La governance, il capitale paziente e le economie di scala determinano l''esito politico più della topologia stessa.\n\nLa tesi: serve un vocabolario nuovo che distingua tra decentralizzazione architetturale, logica e politica. Senza questa distinzione, continueremo a costruire infrastrutture che si presentano come orizzontali ma operano come gerarchie.',
 array['Infrastrutture','Etica'], '2024-03-12', 4820, 612),
('ontologia-modelli-linguistici',
 'Ontologia dei modelli linguistici',
 'Verso una nuova definizione di intelligenza: come la statistica predittiva sta ridefinendo il concetto di comprensione umana.',
 E'Cosa significa "capire" per un modello che non ha corpo, intenzione né tempo? Questo saggio propone una ontologia operativa dei LLM che eviti tanto l''antropomorfismo ingenuo quanto il riduzionismo sprezzante.\n\nArgomento che la comprensione, nei sistemi predittivi, è una proprietà emergente del contesto, non una capacità interna del modello. Da questo segue una serie di implicazioni per la valutazione, la responsabilità giuridica e la pedagogia.',
 array['AI','Cognizione'], '2024-01-22', 7140, 1283),
('ux-post-ai',
 'Nuovi paradigmi di UX nell''era post-AI',
 'L''interfaccia smette di essere un oggetto e diventa una conversazione. Cosa cambia per chi progetta esperienze digitali?',
 E'Per trent''anni la disciplina UX si è costruita attorno alla manipolazione diretta. L''avvento di interfacce conversazionali generative non sostituisce questo paradigma — lo affianca, creando un''ecologia ibrida che richiede nuovi strumenti concettuali.\n\nEsaminiamo cinque pattern emergenti: ambient intent, soft commitment, latency choreography, model-as-material, e generative defaults. Per ciascuno proponiamo euristiche operative.',
 array['UX','AI'], '2023-11-08', 3210, 408),
('fenomenologia-consenso',
 'La fenomenologia del consenso nell''era della sorveglianza algoritmica',
 'I sistemi di raccomandazione non influenzano solo i consumi: ridisegnano la struttura stessa della volizione.',
 E'Il consenso, nel diritto liberale classico, presuppone un soggetto informato e libero. Ma cosa accade quando l''ambiente informativo è esso stesso modellato per massimizzare metriche di engagement?\n\nQuesto paper propone una rilettura fenomenologica del consenso digitale, mutuando categorie da Husserl e Merleau-Ponty, per evidenziare come la sorveglianza algoritmica eroda non solo la privacy ma la struttura della volontà.',
 array['Etica','Sociology'], '2023-09-14', 5670, 901);
