import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiLogin, apiMe, getToken, setToken } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `checking` is true until we've validated any stored token on load, so the
  // route guard doesn't flash the login page for an already-authenticated admin.
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    apiMe()
      .then((u) => alive && setUser(u))
      .catch(() => {
        // token expired or backend rejected it — drop it
        setToken(null);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const { access_token } = await apiLogin(username, password);
    setToken(access_token);
    const me = await apiMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, isAuthed: Boolean(user), checking, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
