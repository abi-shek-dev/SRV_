import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('schoolToken');
        const storedUser = await AsyncStorage.getItem('schoolUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (_) {}
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (srvNumber, password, role) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { srvNumber, password, role });
    const { token: t, user: u } = res.data;
    await AsyncStorage.setItem('schoolToken', t);
    await AsyncStorage.setItem('schoolUser', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('schoolToken');
    await AsyncStorage.removeItem('schoolUser');
    setToken(null);
    setUser(null);
  };

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
