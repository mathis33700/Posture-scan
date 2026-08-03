import { Component, type ErrorInfo, type ReactNode } from 'react';

import { EcranErreur } from './EcranErreur';

type Props = { children: ReactNode };
type State = { erreur: Error | null };

/**
 * Dernier filet de sécurité : rattrape toute erreur de rendu non prévue.
 *
 * Sans lui, React démonte l'arbre entier et laisse une page blanche. En
 * consultation, mieux vaut un message lisible et un bouton pour recharger que
 * de devoir ouvrir la console du navigateur.
 *
 * Reste un composant de classe : `componentDidCatch` n'a pas d'équivalent
 * en composant de fonction.
 */
export class LimiteErreur extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    // Volontairement en console : aucun service externe n'est appelé, une
    // trace d'erreur pouvant contenir des données de patients.
    console.error('Erreur non rattrapée :', erreur, infos.componentStack);
  }

  render() {
    if (!this.state.erreur) return this.props.children;

    return (
      <EcranErreur titre="Une erreur est survenue" detail={this.state.erreur.message}>
        <p>
          L’application s’est arrêtée de façon inattendue. Vos données enregistrées ne sont
          pas touchées.
        </p>
        <p>
          Rechargez la page pour reprendre. Si le problème se répète toujours au même endroit,
          notez ce que vous faisiez juste avant.
        </p>
      </EcranErreur>
    );
  }
}
