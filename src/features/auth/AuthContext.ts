import { createContext } from 'react';

import type { Session } from '@supabase/supabase-js';

export type AuthState = {
  session: Session | null;
  /** `true` tant que la session initiale n'a pas été restaurée depuis le stockage local. */
  chargement: boolean;
};

export const AuthContext = createContext<AuthState | null>(null);
