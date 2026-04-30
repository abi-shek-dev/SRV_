import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [role, setRole] = useState('parent');
  const [srvNumber, setSrvNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!srvNumber.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your ID and password.');
      return;
    }
    try {
      setLoading(true);
      await login(srvNumber.trim().toUpperCase(), password.trim(), role);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'Invalid ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SRV</Text>
          </View>
          <Text style={styles.schoolName}>SRV SCHOOL</Text>
          <Text style={styles.tagline}>Portal Access</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Role tabs */}
          <View style={styles.tabRow}>
            {['parent', 'faculty'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.tab, role === r && styles.tabActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.tabText, role === r && styles.tabTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{role === 'parent' ? 'Parent ID' : 'Faculty ID'}</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={srvNumber}
              onChangeText={setSrvNumber}
              placeholder={role === 'parent' ? 'e.g. SRV26001' : 'e.g. FAC26001'}
              placeholderTextColor="#475569"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder={role === 'parent' ? 'Date of Birth (DDMMYYYY)' : 'Your password'}
              placeholderTextColor="#475569"
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {role === 'parent'
              ? 'Parents: your default password is your child\'s Date of Birth (DDMMYYYY)'
              : 'Faculty: use the password provided by your administrator'}
          </Text>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In as {role === 'parent' ? 'Parent' : 'Faculty'}</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  schoolName: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  tagline: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#334155',
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#0f172a',
    borderRadius: 12, padding: 4, marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a', borderRadius: 12,
    borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#f1f5f9', fontSize: 15, paddingVertical: 14 },
  hint: { color: '#475569', fontSize: 11, textAlign: 'center', marginBottom: 20, lineHeight: 16 },
  btn: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
