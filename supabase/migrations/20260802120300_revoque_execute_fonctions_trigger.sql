-- Retire les fonctions de trigger de l'API REST.
--
-- PostgREST expose automatiquement toute fonction du schéma `public` comme un
-- endpoint RPC. `handle_new_user()` et `set_maj_le()` s'y retrouvaient donc
-- appelables depuis l'extérieur, la première étant de surcroît en
-- SECURITY DEFINER : elle se serait exécutée avec les droits de son
-- propriétaire, à la demande de n'importe quel visiteur non connecté.
--
-- L'appel échouerait faute d'enregistrement `new`, mais exposer une fonction
-- privilégiée sur une base de données de santé n'a aucune raison d'être.
-- Signalé par le linter Supabase (0028 et 0029).
--
-- La révocation vise `anon` et `authenticated` nommément, et non `public` :
-- ces droits ne viennent pas du GRANT implicite à PUBLIC mais de grants
-- explicites posés par les default privileges de Supabase sur le schéma
-- `public`. L'ACL de la fonction le montre — `anon=X/postgres`,
-- `authenticated=X/postgres`. Révoquer sur PUBLIC serait sans effet.
--
-- `service_role` conserve le droit : cette clé ne quitte jamais un serveur de
-- confiance, et la retirer n'apporterait rien.
--
-- Les triggers continuent de fonctionner : PostgreSQL ne vérifie pas le droit
-- EXECUTE au déclenchement d'un trigger, seulement à sa création. Vérifié sur
-- ce projet avant d'appliquer cette migration — un trigger SECURITY DEFINER
-- dont la fonction avait été révoquée s'est bien déclenché pour un rôle sans
-- aucun droit dessus.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_maj_le() from anon, authenticated;
