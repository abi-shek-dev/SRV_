import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../config/api';
import { registerForPushNotifications, savePushTokenToServer, removePushTokenFromServer } from '../utils/pushNotifications';

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
          // Re-register push token on app restore
          registerForPushNotifications().then(pushToken => {
            if (pushToken) savePushTokenToServer(storedToken, pushToken);
          }).catch(() => {});
        }
      } catch (_) {}
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (srvNumber, password, role) => {
    const url = `${API_URL}/api/auth/login`;
    console.log('[LOGIN] Attempting login...');
    console.log('[LOGIN] URL:', url);
    console.log('[LOGIN] Payload:', { srvNumber, password: '***' });
    const res = await axios.post(url, { srvNumber, password });
    // Server returns: { _id, name, srvNumber, role, token, assignedGrade, assignedSection }
    console.log('[LOGIN] Response status:', res.status);
    console.log('[LOGIN] Response data:', JSON.stringify(res.data));
    const { token: t, ...userData } = res.data;
    const u = userData;
    await AsyncStorage.setItem('schoolToken', t);
    await AsyncStorage.setItem('schoolUser', JSON.stringify(u));
    setToken(t);
    setUser(u);
    console.log('[LOGIN] Success! Role:', u.role);

    // Register push notifications after successful login
    registerForPushNotifications().then(pushToken => {
      if (pushToken) savePushTokenToServer(t, pushToken);
    }).catch(() => {});

    return u;
  };

  const logout = async () => {
    // Remove push token from server before clearing auth
    if (token) removePushTokenFromServer(token).catch(() => {});
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
