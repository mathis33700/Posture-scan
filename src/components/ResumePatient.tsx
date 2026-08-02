import { calculerAge, formaterDateCourte } from '@/lib/format';

/** Identité compacte du patient, réutilisée par les écrans de bilan et de comparaison. */
export function ResumePatient({
  patient,
}: {
  patient: { nom: string; prenom: string; date_naissance: string | null };
}) {
  const age = calculerAge(patient.date_naissance);

  return (
    <p className="text-ardoise-500 text-sm">
      {patient.nom.toUpperCase()} {patient.prenom}
      {age !== null && ` · ${age} ans`}
      {patient.date_naissance && ` · né(e) le ${formaterDateCourte(patient.date_naissance)}`}
    </p>
  );
}
