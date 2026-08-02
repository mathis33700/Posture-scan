-- Row Level Security : isolation stricte entre praticiens.
--
-- Toutes les tables métier portent `praticien_id`, la politique se réduit donc
-- à une égalité avec auth.uid(). L'appel est enveloppé dans un `select` pour
-- que Postgres l'évalue une seule fois par requête au lieu d'une fois par
-- ligne (initPlan) — sans quoi les listes de patients se dégradent vite.
--
-- `to authenticated` exclut d'emblée le rôle anon : aucune donnée patient
-- n'est atteignable sans session.

alter table public.praticiens enable row level security;
alter table public.patients   enable row level security;
alter table public.bilans     enable row level security;
alter table public.cliches    enable row level security;
alter table public.points     enable row level security;
alter table public.mesures    enable row level security;

-- ---------------------------------------------------------------- praticiens
-- Pas de politique INSERT : la fiche est créée par le trigger
-- handle_new_user() en SECURITY DEFINER. Pas de DELETE non plus : la
-- suppression passe par celle du compte auth, qui cascade.

create policy "praticien lit sa fiche"
  on public.praticiens for select to authenticated
  using (id = (select auth.uid()));

create policy "praticien modifie sa fiche"
  on public.praticiens for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ------------------------------------------------------------------ patients

create policy "praticien lit ses patients"
  on public.patients for select to authenticated
  using (praticien_id = (select auth.uid()));

create policy "praticien cree ses patients"
  on public.patients for insert to authenticated
  with check (praticien_id = (select auth.uid()));

create policy "praticien modifie ses patients"
  on public.patients for update to authenticated
  using (praticien_id = (select auth.uid()))
  with check (praticien_id = (select auth.uid()));

create policy "praticien supprime ses patients"
  on public.patients for delete to authenticated
  using (praticien_id = (select auth.uid()));

-- -------------------------------------------------------------------- bilans

create policy "praticien lit ses bilans"
  on public.bilans for select to authenticated
  using (praticien_id = (select auth.uid()));

create policy "praticien cree ses bilans"
  on public.bilans for insert to authenticated
  with check (praticien_id = (select auth.uid()));

create policy "praticien modifie ses bilans"
  on public.bilans for update to authenticated
  using (praticien_id = (select auth.uid()))
  with check (praticien_id = (select auth.uid()));

create policy "praticien supprime ses bilans"
  on public.bilans for delete to authenticated
  using (praticien_id = (select auth.uid()));

-- ------------------------------------------------------------------- cliches

create policy "praticien lit ses cliches"
  on public.cliches for select to authenticated
  using (praticien_id = (select auth.uid()));

create policy "praticien cree ses cliches"
  on public.cliches for insert to authenticated
  with check (praticien_id = (select auth.uid()));

create policy "praticien modifie ses cliches"
  on public.cliches for update to authenticated
  using (praticien_id = (select auth.uid()))
  with check (praticien_id = (select auth.uid()));

create policy "praticien supprime ses cliches"
  on public.cliches for delete to authenticated
  using (praticien_id = (select auth.uid()));

-- -------------------------------------------------------------------- points

create policy "praticien lit ses points"
  on public.points for select to authenticated
  using (praticien_id = (select auth.uid()));

create policy "praticien cree ses points"
  on public.points for insert to authenticated
  with check (praticien_id = (select auth.uid()));

create policy "praticien modifie ses points"
  on public.points for update to authenticated
  using (praticien_id = (select auth.uid()))
  with check (praticien_id = (select auth.uid()));

create policy "praticien supprime ses points"
  on public.points for delete to authenticated
  using (praticien_id = (select auth.uid()));

-- ------------------------------------------------------------------- mesures

create policy "praticien lit ses mesures"
  on public.mesures for select to authenticated
  using (praticien_id = (select auth.uid()));

create policy "praticien cree ses mesures"
  on public.mesures for insert to authenticated
  with check (praticien_id = (select auth.uid()));

create policy "praticien modifie ses mesures"
  on public.mesures for update to authenticated
  using (praticien_id = (select auth.uid()))
  with check (praticien_id = (select auth.uid()));

create policy "praticien supprime ses mesures"
  on public.mesures for delete to authenticated
  using (praticien_id = (select auth.uid()));
