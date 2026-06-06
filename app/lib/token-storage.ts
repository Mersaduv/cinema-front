const AUTH_TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },
};
