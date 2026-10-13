const TOKEN_KEY = 'jobtrack_jwt_token';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store authentication token');
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Graceful error suppression
    }
  },

  hasToken: (): boolean => {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};
