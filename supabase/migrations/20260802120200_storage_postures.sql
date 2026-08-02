-- Stockage des photos posturales.
--
-- Bucket privé : ce sont des photos de patients, elles ne doivent jamais être
-- accessibles par URL publique. L'application y accède uniquement via des URL
-- signées de courte durée générées côté client authentifié.
--
-- Convention de chemin : {praticien_id}/{patient_id}/{bilan_id}/{vue}.jpg
-- Le premier segment étant l'identifiant du praticien, les politiques peuvent
-- se contenter de le comparer à auth.uid().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'postures',
  'postures',
  false,
  10485760, -- 10 Mio : large pour une photo recompressée côté client
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "praticien lit ses photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'postures'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "praticien depose ses photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'postures'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "praticien remplace ses photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'postures'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'postures'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "praticien supprime ses photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'postures'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
