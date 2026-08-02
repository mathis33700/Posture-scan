# Posture Scan

Application web d'analyse posturale à usage professionnel : photos de face, de dos et de
profil, placement manuel de points anatomiques, calcul d'angles et de déviations, suivi de
l'évolution et rapport PDF imprimable.

Installable sur iPhone et tablette via « Ajouter à l'écran d'accueil ».

## Sommaire

- [Stack](#stack)
- [Mise en place de Supabase](#mise-en-place-de-supabase)
- [Développement local](#développement-local)
- [Déploiement sur Cloudflare Pages](#déploiement-sur-cloudflare-pages)
- [Calibrage du cabinet](#calibrage-du-cabinet)
- [Sécurité et données de santé](#sécurité-et-données-de-santé)
- [Modèle de données](#modèle-de-données)
- [Structure du code](#structure-du-code)

## Stack

| Domaine     | Choix                                                             |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite 8                                      |
| Styles      | Tailwind CSS v4 (via `@tailwindcss/vite`, sans fichier de config) |
| Routage     | React Router 7                                                    |
| Données     | TanStack Query 5                                                  |
| Backend     | Supabase — Postgres, Auth, Storage                                |
| PWA         | `vite-plugin-pwa`                                                 |
| PDF         | jsPDF, chargé à la demande                                        |
| Tests       | Vitest                                                            |
| Hébergement | Cloudflare Pages                                                  |

Vercel est écarté volontairement : son offre gratuite interdit l'usage commercial, ce qui
s'applique à un outil de cabinet.

## Mise en place de Supabase

### 1. Créer le projet

Le projet gratuit d'une organisation Supabase étant unique, créez si besoin une **nouvelle
organisation** pour Posture Scan plutôt que d'ajouter un second projet à une organisation
existante — celui-ci serait facturé. Choisissez une région européenne (`eu-west-1` par
exemple) : les données patients ne quitteront pas l'Union.

### 2. Appliquer les migrations

Les trois migrations de `supabase/migrations/` sont à appliquer **dans l'ordre de leur
préfixe horodaté**.

Avec la CLI Supabase :

```bash
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

Ou, sans CLI, en collant le contenu de chaque fichier dans le SQL Editor du tableau de bord,
dans cet ordre :

1. `20260802120000_schema_initial.sql` — tables, contraintes, triggers
2. `20260802120100_rls.sql` — Row Level Security
3. `20260802120200_storage_postures.sql` — bucket privé et ses politiques

Vérifiez ensuite dans **Advisors → Security** qu'aucune table n'est signalée sans RLS.

### 3. Créer le compte praticien

L'application **n'expose pas d'inscription publique** : sur une base de données de santé,
un formulaire ouvert laisserait n'importe qui créer un compte. Les comptes se créent depuis
le tableau de bord Supabase, dans **Authentication → Users → Add user**, avec « Auto Confirm
User » activé.

Le trigger `on_auth_user_created` crée automatiquement la fiche `praticiens` correspondante.
Le nom et le cabinet se renseignent ensuite dans l'écran Réglages de l'application.

### 4. Régénérer les types TypeScript

Après toute migration ultérieure :

```bash
npx supabase gen types typescript --project-id <ref-du-projet> > src/types/database.ts
```

`src/types/database.ts` est **entièrement généré** et écrasé à chaque exécution : n'y écrivez
rien. Le vocabulaire métier (`Patient`, `Bilan`, `Cliche`, `VuePosturale`…) vit à côté, dans
`src/types/domaine.ts`, qui est le seul module de types que l'application importe.

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigner les deux variables
npm run dev
```

Les deux variables attendues, lisibles dans **Project Settings → API** :

| Variable                        | Où la trouver                      |
| ------------------------------- | ---------------------------------- |
| `VITE_SUPABASE_URL`             | Project URL                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publiable (`sb_publishable_…`) |

Ces deux valeurs sont publiques par nature : elles finissent dans le bundle JavaScript. La
sécurité repose entièrement sur la Row Level Security, jamais sur leur confidentialité. La
clé `service_role`, elle, ne doit **jamais** apparaître dans ce dépôt ni dans le frontend.

### Scripts

| Commande            | Effet                              |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Serveur de développement           |
| `npm run build`     | Typecheck puis build de production |
| `npm run preview`   | Sert le build de production        |
| `npm run typecheck` | Vérification des types seule       |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier en écriture               |
| `npm run test`      | Tests Vitest                       |

Les icônes PWA se régénèrent avec `node scripts/generate-icons.mjs`.

## Déploiement sur Cloudflare

Le dépôt est configuré pour **Cloudflare Workers** via `wrangler.jsonc` : application
purement statique, sans code serveur, avec `not_found_handling` en mode
`single-page-application` pour que le routage côté navigateur survive à un rechargement sur
`/patients/…`.

| Réglage            | Valeur                |
| ------------------ | --------------------- |
| Commande de build  | `npm run build`       |
| Commande de deploy | `npx wrangler deploy` |
| Version de Node    | 22                    |

**Les deux variables doivent être déclarées comme variables de _build_**, pas comme
variables d'exécution. Vite les inline dans le bundle au moment de la compilation : une
variable fournie seulement à l'exécution ne sera jamais lue, et l'application s'arrêtera sur
« Configuration Supabase absente ».

Le déploiement peut aussi se faire à la main depuis un poste authentifié (`wrangler login`) :

```bash
npm run deploy
```

Un déploiement sur **Cloudflare Pages** reste possible sans rien changer : commande de build
`npm run build`, répertoire de sortie `dist`. Le fichier `public/_redirects` y assure le
même repli vers `index.html` que `not_found_handling` côté Workers.

Pensez enfin à ajouter l'URL de production dans **Authentication → URL Configuration** côté
Supabase (Site URL et Redirect URLs), faute de quoi les liens de réinitialisation de mot de
passe ne reviendront pas sur l'application.

## Calibrage du cabinet

Les photos étant toujours prises au même endroit et à la même distance, une seule mesure
suffit pour tout le cabinet.

1. Placez une règle ou un mètre à l'emplacement habituel du patient.
2. Photographiez-la dans les conditions habituelles, puis créez un bilan de test avec cette
   photo.
3. Relevez combien de pixels couvrent 10 cm, divisez par 10.
4. Reportez la valeur dans **Réglages → Calibrage**.

Sans ce réglage, l'application reste utilisable : tous les **angles** sont calculés, seules
les mesures exprimées en centimètres (déports, antépositions) sont omises. Elles apparaîtront
d'elles-mêmes sur les bilans existants dès que le calibrage sera renseigné, les mesures étant
recalculées à partir des points à chaque affichage.

## Sécurité et données de santé

- **RLS active sur les six tables**, restreinte au rôle `authenticated` : un praticien ne
  voit que ses propres patients, et rien n'est atteignable sans session.
- **Bucket `postures` privé.** Les photos ne sont accessibles que par URL signée valable une
  heure, renouvelée pendant la consultation. Aucune URL publique n'est jamais générée.
- **Le service worker ne précache que le shell applicatif.** Aucune photo patient ni réponse
  Supabase n'est mise en cache par le navigateur.
- **Le cache mémoire est vidé à la déconnexion**, pour qu'aucune donnée ne survive à la
  session.
- **Pas d'inscription publique** (voir plus haut).
- Le consentement photo est géré sur papier au cabinet ; l'application ne le duplique pas.

## Modèle de données

```
praticiens ─┬─ patients ─── bilans ─┬─ cliches ─── points
            │                        └─ mesures
            └─ (id = auth.users.id)
```

Un **bilan** correspond à une séance à une date donnée et regroupe jusqu'à trois **clichés**
(face, dos, profil). C'est un écart assumé avec le premier jet du schéma, qui plaçait la vue
directement sur l'évaluation : le rapport, l'historique et la comparaison raisonnent tous au
niveau de la séance, pas de la photo isolée.

`praticien_id` est dénormalisé sur toutes les tables pour que les politiques RLS se réduisent
à `praticien_id = auth.uid()`, sans jointure. Les clés étrangères sont **composites** et
pointent vers un couple `(id, praticien_id)` unique côté parent : la colonne dénormalisée ne
peut donc pas diverger de celle du parent, et c'est la base qui le garantit.

Les clichés stockent les **dimensions réelles de l'image**. Les points étant normalisés entre
0 et 1, un angle calculé directement sur ces coordonnées serait mesuré sur une image écrasée
au carré — sur une photo 3:4, une bascule de 7,6° serait rapportée à 5,7. Toute la géométrie
repasse en pixels avant calcul.

Les **mesures sont dérivées** : elles sont recalculées à partir des points à chaque affichage,
et persistées seulement pour que l'historique et le rapport n'aient pas à recharger tous les
points de tous les bilans.

## Structure du code

```
src/
├── components/        Composants transverses et primitives d'interface
├── features/
│   ├── annotation/    Éditeur de points : pan/zoom, loupe, glisser-déposer
│   ├── auth/          Session, route protégée, messages d'erreur
│   ├── bilans/        Séances
│   ├── cliches/       Photos et capture
│   ├── comparaison/   Rapprochement de deux bilans
│   ├── mesures/       Persistance et affichage des mesures
│   ├── patients/      Fiches patients
│   ├── points/        Points anatomiques
│   ├── praticien/     Fiche praticien et calibrage
│   └── report/        Rendu canvas et composition PDF
├── lib/               Logique pure : géométrie, mesures, catalogue, formats
├── pages/             Écrans routés
└── types/             database.ts (généré) et domaine.ts (alias métier)
```

Le cœur métier — `lib/geometry.ts`, `lib/measures.ts`, `features/comparaison/ecarts.ts` — est
sans dépendance à React et couvert par les tests.

## Pistes V2

Le code est disposé pour les accueillir sans refonte :

- **Détection automatique des points** (MediaPipe Pose ou équivalent). Le catalogue de points
  vit dans `src/lib/points-catalog.ts`, en code et non en base : un modèle n'aura qu'à
  produire ses repères sur ces mêmes codes, avec ajustement manuel ensuite par l'éditeur
  existant.
- **Mesures d'amplitude articulaire (ROM)** via les capteurs de l'appareil. Elles
  s'ajouteraient comme un nouveau type dans `mesures`, dont le schéma ne présuppose rien de
  la provenance de la valeur.

## Point encore ouvert

Le contenu exact du rapport PDF reste à valider avec la praticienne. Toute la mise en page
est isolée dans `src/features/report/pdf.ts` et peut être reprise sans toucher au reste.
