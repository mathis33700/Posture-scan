import type { AuthError } from '@supabase/supabase-js';

/**
 * Les messages de Supabase Auth sont en anglais et techniques. On traduit les
 * cas courants ; le reste retombe sur un message générique plutôt que d'exposer
 * un détail interne au praticien.
 */
export function messageErreurAuth(erreur: AuthError | Error): string {
  const brut = erreur.message.toLowerCase();

  if (brut.includes('invalid login credentials')) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }
  if (brut.includes('email not confirmed')) {
    return "Cette adresse n'a pas encore été confirmée. Vérifiez votre boîte de réception.";
  }
  if (brut.includes('rate limit') || brut.includes('too many requests')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (brut.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  if (brut.includes('new password should be different')) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (brut.includes('failed to fetch') || brut.includes('network')) {
    return 'Connexion au serveur impossible. Vérifiez le réseau du cabinet.';
  }
  return 'Connexion impossible pour le moment. Réessayez dans un instant.';
}
