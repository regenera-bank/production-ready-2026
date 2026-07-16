const TOKEN_KEY = 'regenera.session.token';
const NAME_KEY = 'regenera.session.name';

export interface SessionSnapshot {
  accessToken: string;
  displayName: string;
}

export const saveSession = (session: SessionSnapshot): void => {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(NAME_KEY, session.displayName);
};

/** Token emitido pelo BFF homolog/didit — não passa por Firebase Auth. */
export const isBffHomologToken = (accessToken: string): boolean =>
  accessToken.startsWith('homolog-');

export const loadSession = (): SessionSnapshot | null => {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const displayName = localStorage.getItem(NAME_KEY);
  if (!accessToken || !displayName) {
    return null;
  }
  return { accessToken, displayName };
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
};