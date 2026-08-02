const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const FORMAT_DATE_COURTE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/** Convertit une date SQL (`YYYY-MM-DD`) en Date locale, sans décalage de fuseau. */
function depuisDateSql(dateSql: string): Date | null {
  const [annee, mois, jour] = dateSql.split('-').map(Number);
  if (!annee || !mois || !jour) return null;
  return new Date(annee, mois - 1, jour);
}

export function formaterDate(dateSql: string | null): string {
  if (!dateSql) return '—';
  const date = depuisDateSql(dateSql);
  return date ? FORMAT_DATE.format(date) : '—';
}

export function formaterDateCourte(dateSql: string | null): string {
  if (!dateSql) return '—';
  const date = depuisDateSql(dateSql);
  return date ? FORMAT_DATE_COURTE.format(date) : '—';
}

/** Date du jour au format attendu par Postgres et par `<input type="date">`. */
export function dateDuJourSql(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

/** Âge en années révolues, ou `null` si la date de naissance est inconnue. */
export function calculerAge(dateNaissanceSql: string | null): number | null {
  if (!dateNaissanceSql) return null;
  const naissance = depuisDateSql(dateNaissanceSql);
  if (!naissance) return null;

  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const moisEcoules = aujourdhui.getMonth() - naissance.getMonth();
  // L'anniversaire n'est pas encore passé cette année.
  if (moisEcoules < 0 || (moisEcoules === 0 && aujourdhui.getDate() < naissance.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function nomComplet(patient: { nom: string; prenom: string }): string {
  return `${patient.nom.toUpperCase()} ${patient.prenom}`;
}
