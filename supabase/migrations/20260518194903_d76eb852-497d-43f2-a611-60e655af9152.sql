
-- Create public bucket for paper PDFs
insert into storage.buckets (id, name, public)
values ('papers', 'papers', true)
on conflict (id) do nothing;

-- Anyone can read PDFs (public bucket)
create policy "Public can read paper PDFs"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'papers');

-- Only admins can upload/update/delete
create policy "Admins can upload paper PDFs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'papers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update paper PDFs"
on storage.objects for update
to authenticated
using (bucket_id = 'papers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete paper PDFs"
on storage.objects for delete
to authenticated
using (bucket_id = 'papers' and public.has_role(auth.uid(), 'admin'));
