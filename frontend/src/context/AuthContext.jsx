import { createContext, useContext, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const stored = localStorage.getItem('katha_user');
    const user = stored ? JSON.parse(stored) : null;
    return user?.email && localStorage.getItem('katha_token') ? user : null;
  } catch {
    localStorage.removeItem('katha_user');
    localStorage.removeItem('katha_user_email');
    localStorage.removeItem('katha_token');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const requestLogin = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await apiClient.post('/auth/register', {
        name: name.trim(),
        email: normalizedEmail,
        password,
      });
    } catch (err) {
      if (err.response?.status !== 409) throw err;
      await apiClient.post('/auth/email-login', {
        name: name.trim(),
        email: normalizedEmail,
      });
    }
    return normalizedEmail;
  };

  const login = async ({ email, code }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data } = await apiClient.post('/auth/verify-email', {
      email: normalizedEmail,
      code,
    });
    localStorage.setItem('katha_token', data.token);
    localStorage.setItem('katha_user_email', data.user.email);
    localStorage.setItem('katha_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('katha_token');
    localStorage.removeItem('katha_user_email');
    localStorage.removeItem('katha_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, email: user?.email || null, requestLogin, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
