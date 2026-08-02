-- Index de la clé étrangère `mesures.cliche_id`.
--
-- Reprendre une photo supprime son cliché, ce qui doit faire disparaître en
-- cascade les mesures qui en dépendent. Sans index sur `cliche_id`, Postgres
-- parcourt toute la table `mesures` à chaque reprise de photo — un geste
-- courant en consultation.
--
-- Les autres clés étrangères signalées par le linter (0001) n'ont pas besoin
-- d'index supplémentaire : leur première colonne est déjà en tête d'un index
-- existant — `bilans_patient_date_idx` pour `bilans.patient_id`, et les index
-- des contraintes d'unicité `cliches (bilan_id, vue)`,
-- `points (cliche_id, code_point)` et `mesures (bilan_id, type)` pour les
-- autres. Les doubler ne ferait que ralentir les écritures.

create index mesures_cliche_idx on public.mesures (cliche_id);
