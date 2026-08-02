# Projet : application d'analyse posturale (alternative à PostureScreen)

## Contexte

PWA à usage professionnel pour une chiropractrice (cabinet Chiro Nexus) : relevés posturaux
de patients, placement de points anatomiques sur photo, calcul d'angles et de déviations,
suivi de l'évolution. Objectif : remplacer un abonnement PostureScreen (~70 € + 30 €/mois)
par un outil interne, sans dépendance à un logiciel propriétaire.

## Utilisateurs

- V1 : une seule praticienne.
- Évolution prévue : partage avec des collègues. L'architecture est **multi-praticiens dès la
  V1**, même si un seul compte est actif.
- Isolation stricte : chaque praticien ne voit que ses propres patients.

## Contexte d'usage

- Photos toujours prises au cabinet, même pièce, même distance caméra-patient : un calibrage
  unique par cabinet suffit, il ne se refait pas à chaque patient.
- Usage sur iPhone **et** tablette : l'interface est responsive dans les deux sens, pas
  seulement mobile-first étirée.
- Pas de deadline serrée : une base propre prime sur un MVP bâclé.

## Périmètre V1 — livré

1. Gestion patients : création, consultation, édition, recherche, suppression.
2. Capture posturale : photo ou upload sur trois vues (face, dos, profil).
3. Placement manuel de points anatomiques, draggables, avec zoom, loupe et annulation.
4. Calcul d'angles et de déviations à partir des points.
5. Historique des bilans et comparaison de deux bilans (côte à côte ou superposition).
6. Rapport consultable dans l'application et exportable en PDF imprimable.
7. Conservation illimitée des données (aucune purge automatique).

## V2 — pas maintenant, mais l'architecture y est prête

- Détection automatique des points via un modèle de pose estimation, avec ajustement manuel
  ensuite. Le catalogue de points est en code (`src/lib/points-catalog.ts`), pas en base :
  un modèle produira ses repères sur les mêmes codes, sans migration.
- Mesures ROM via capteurs de mouvement. Le schéma de `mesures` ne présuppose rien de la
  provenance d'une valeur.

## Stack retenue

- **Frontend** : React 19 + Vite 8 + TypeScript + Tailwind CSS v4 (via `@tailwindcss/vite`,
  sans `tailwind.config.js`).
- **PWA** : `vite-plugin-pwa`, installable sur iPhone via « Ajouter à l'écran d'accueil ».
- **Backend** : Supabase — Postgres, Auth e-mail/mot de passe, Storage privé.
- **Hébergement** : Cloudflare Pages. Pas Vercel : son offre gratuite interdit l'usage
  commercial, ce qui s'applique ici.
- **PDF** : jsPDF côté client, chargé dynamiquement.
- **Tests** : Vitest sur le cœur métier (géométrie, mesures, écarts).

## Schéma de base de données

```
praticiens (id = auth.users.id, email, nom, cabinet, echelle_px_par_cm)
patients   (id, praticien_id, nom, prenom, date_naissance, notes)
bilans     (id, praticien_id, patient_id, date_bilan, notes)
cliches    (id, praticien_id, bilan_id, vue, photo_path, image_largeur, image_hauteur)
points     (id, praticien_id, cliche_id, code_point, x, y)      -- x, y normalisés 0-1
mesures    (id, praticien_id, bilan_id, cliche_id, type, valeur, unite)
```

**Écart assumé avec le premier jet.** Celui-ci plaçait `vue` sur l'évaluation, ce qui produit
une ligne par photo sans regrouper les trois vues d'une même séance. Le rapport, l'historique
et la comparaison raisonnent tous au niveau « bilan du jour », d'où le niveau intermédiaire
`bilans` → `cliches`.

`praticien_id` est dénormalisé partout pour que la RLS se réduise à `praticien_id =
auth.uid()`. Les clés étrangères sont composites, vers `(id, praticien_id)` : la cohérence
est garantie par la base, pas par l'application.

## Invariants à ne pas casser

- **Les calculs géométriques se font en pixels, jamais sur les coordonnées normalisées.** Un
  angle calculé sur du 0-1 est mesuré sur une image écrasée au carré : sur une photo 3:4,
  7,6° deviennent 5,7. C'est pourquoi `cliches` stocke les dimensions de l'image, et pourquoi
  `lib/geometry.ts` n'accepte que des points en pixels.
- **Les mesures bilatérales s'expriment dans le repère du patient**, pas dans celui de
  l'image : positif signifie « côté gauche du patient plus haut ». De face le patient nous
  fait face, de dos il est retourné ; l'écart horizontal est donc pris en valeur absolue.
- **Sur le profil, le sens de l'avant se déduit** de la position du tragus par rapport à C7.
  Une prise de vue et son miroir doivent donner des mesures identiques.
- **Une mesure dont un point manque n'est pas calculée**, jamais renvoyée à zéro : un angle
  nul se lirait comme une posture parfaitement symétrique.
- **L'orientation EXIF est appliquée à l'import** (`imageOrientation: 'from-image'`), pour
  que ce qui est stocké soit droit et que les points correspondent au fichier.
- **Les évolutions se jugent sur la distance à la norme**, pas sur les valeurs brutes : une
  bascule passant de −6° à +5° est une amélioration.

## Sécurité et conformité

- RLS active sur les six tables, restreinte au rôle `authenticated`.
- Bucket Storage `postures` privé, accès par URL signée d'une heure uniquement.
- **Pas d'inscription publique** : les comptes praticiens se créent depuis la console
  Supabase. Un formulaire ouvert sur une base de santé laisserait n'importe qui créer un
  compte.
- Le service worker ne précache que le shell : aucune photo patient, aucune réponse Supabase
  en cache navigateur.
- Le cache mémoire est vidé à la déconnexion.
- Consentement photo géré sur papier au cabinet, pas dupliqué dans l'application.
- Ce sont des données de santé : rester rigoureux sur l'accès, ne jamais exposer les photos.

## Conventions de code

- Interface et nommage du domaine en français ; le vocabulaire du code suit celui de la
  praticienne (bilan, cliché, bascule, déport, antéposition).
- Logique pure dans `src/lib/`, sans dépendance à React, et testée.
- Les formulaires s'initialisent depuis leurs props dans un sous-composant monté une fois les
  données chargées, plutôt que par un effet de synchronisation.
- Prettier et ESLint font foi ; `npm run typecheck && npm run lint && npm run test` doit
  passer avant tout commit.

## Point encore ouvert

Contenu exact du rapport PDF, à valider avec la praticienne. La mise en page est isolée dans
`src/features/report/pdf.ts`.
