-- Schéma initial de Posture Scan.
--
-- Modélisation : un praticien suit des patients ; chaque patient a des bilans
-- (une séance à une date donnée) ; chaque bilan porte jusqu'à trois clichés
-- (face / dos / profil) ; chaque cliché porte des points anatomiques, et le
-- bilan porte les mesures qui en découlent.
--
-- `praticien_id` est volontairement dénormalisé sur toutes les tables : les
-- politiques RLS se réduisent alors à une comparaison avec auth.uid(), sans
-- chaîne de jointures. Pour que cette colonne ne puisse jamais diverger de
-- celle du parent, chaque clé étrangère est composite et pointe vers un couple
-- (id, praticien_id) unique côté parent — la cohérence est donc garantie par
-- la base, pas par l'application.

create type public.vue_posturale as enum ('face', 'dos', 'profil');

-- Horodatage de dernière modification, partagé par toutes les tables.
create or replace function public.set_maj_le()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.maj_le = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- praticiens

create table public.praticiens (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nom text not null default '',
  cabinet text not null default '',
  -- Calibrage du cabinet : les photos étant prises au même endroit et à la
  -- même distance, une seule échelle suffit pour convertir des pixels en
  -- centimètres. Reste NULL tant qu'elle n'a pas été mesurée ; dans ce cas
  -- l'application n'affiche que les mesures angulaires, qui n'en dépendent pas.
  echelle_px_par_cm double precision check (echelle_px_par_cm > 0),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

create trigger praticiens_maj_le
  before update on public.praticiens
  for each row execute function public.set_maj_le();

-- Création automatique de la fiche praticien à l'inscription. SECURITY DEFINER
-- car le trigger s'exécute avant que la session de l'utilisateur n'existe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.praticiens (id, email, nom, cabinet)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    coalesce(new.raw_user_meta_data ->> 'cabinet', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ patients

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens (id) on delete cascade,
  nom text not null check (length(trim(nom)) > 0),
  prenom text not null check (length(trim(prenom)) > 0),
  date_naissance date check (date_naissance <= current_date),
  notes text not null default '',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  -- Cible des clés étrangères composites des tables filles.
  unique (id, praticien_id)
);

create index patients_praticien_nom_idx
  on public.patients (praticien_id, nom, prenom);

create trigger patients_maj_le
  before update on public.patients
  for each row execute function public.set_maj_le();

-- -------------------------------------------------------------------- bilans

create table public.bilans (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens (id) on delete cascade,
  patient_id uuid not null,
  date_bilan date not null default current_date,
  notes text not null default '',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  foreign key (patient_id, praticien_id)
    references public.patients (id, praticien_id) on delete cascade,
  unique (id, praticien_id)
);

create index bilans_patient_date_idx
  on public.bilans (patient_id, date_bilan desc);

create index bilans_praticien_idx on public.bilans (praticien_id);

create trigger bilans_maj_le
  before update on public.bilans
  for each row execute function public.set_maj_le();

-- ------------------------------------------------------------------- cliches

create table public.cliches (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens (id) on delete cascade,
  bilan_id uuid not null,
  vue public.vue_posturale not null,
  -- Chemin dans le bucket privé `postures`, jamais une URL : l'accès se fait
  -- exclusivement par URL signée à durée courte.
  photo_path text not null,
  -- Dimensions réelles du fichier stocké. Indispensables : les points sont
  -- normalisés 0-1, et un angle calculé sur des coordonnées normalisées est
  -- faux dès que l'image n'est pas carrée. Toute la géométrie repasse en
  -- pixels via ces deux colonnes.
  image_largeur integer not null check (image_largeur > 0),
  image_hauteur integer not null check (image_hauteur > 0),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  foreign key (bilan_id, praticien_id)
    references public.bilans (id, praticien_id) on delete cascade,
  -- Une seule photo par vue et par bilan.
  unique (bilan_id, vue),
  unique (id, praticien_id)
);

create index cliches_praticien_idx on public.cliches (praticien_id);

create trigger cliches_maj_le
  before update on public.cliches
  for each row execute function public.set_maj_le();

-- -------------------------------------------------------------------- points

create table public.points (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens (id) on delete cascade,
  cliche_id uuid not null,
  -- Code du catalogue défini côté application (src/lib/points-catalog.ts) :
  -- le faire évoluer ne demande pas de migration, et la détection automatique
  -- prévue en V2 mappera ses landmarks sur ces mêmes codes.
  code_point text not null check (length(trim(code_point)) > 0),
  x double precision not null check (x >= 0 and x <= 1),
  y double precision not null check (y >= 0 and y <= 1),
  maj_le timestamptz not null default now(),
  foreign key (cliche_id, praticien_id)
    references public.cliches (id, praticien_id) on delete cascade,
  unique (cliche_id, code_point)
);

create index points_praticien_idx on public.points (praticien_id);

create trigger points_maj_le
  before update on public.points
  for each row execute function public.set_maj_le();

-- ------------------------------------------------------------------- mesures

create table public.mesures (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens (id) on delete cascade,
  bilan_id uuid not null,
  -- NULL pour une mesure synthétisant plusieurs vues ; sinon la vue d'origine.
  cliche_id uuid,
  type text not null check (length(trim(type)) > 0),
  valeur double precision not null,
  unite text not null check (unite in ('deg', 'cm', 'px')),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  foreign key (bilan_id, praticien_id)
    references public.bilans (id, praticien_id) on delete cascade,
  -- MATCH SIMPLE : contrainte non vérifiée quand cliche_id est NULL, ce qui
  -- est exactement le comportement voulu pour une mesure multi-vues.
  foreign key (cliche_id, praticien_id)
    references public.cliches (id, praticien_id) on delete cascade,
  -- Une mesure d'un type donné est unique dans un bilan : le recalcul écrase
  -- la valeur précédente au lieu d'empiler des doublons.
  unique (bilan_id, type)
);

create index mesures_praticien_idx on public.mesures (praticien_id);

create trigger mesures_maj_le
  before update on public.mesures
  for each row execute function public.set_maj_le();
