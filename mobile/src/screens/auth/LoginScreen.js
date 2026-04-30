import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import theme from '../../config/theme';

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
      console.log('[LOGIN ERROR] Full error:', err.message);
      console.log('[LOGIN ERROR] Response:', JSON.stringify(err.response?.data));
      console.log('[LOGIN ERROR] Status:', err.response?.status);
      console.log('[LOGIN ERROR] Network error?', !err.response ? 'YES - cannot reach server' : 'No');
      Alert.alert('Login failed', err.response?.data?.message || err.message || 'Invalid ID or password.');
    } finally {
      setLoading(false);
    }
  };

  const isParent = role === 'parent';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header banner */}
        <View style={styles.banner}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SRV</Text>
          </View>
          <Text style={styles.schoolName}>SRV School</Text>
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

          <Text style={styles.label}>{isParent ? 'Parent ID' : 'Faculty ID'}</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={srvNumber}
              onChangeText={setSrvNumber}
              placeholder={isParent ? 'e.g. SRV26001' : 'e.g. FAC26001'}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder={isParent ? 'Date of Birth (DDMMYYYY)' : 'Your password'}
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {isParent
              ? "Default password is your child's Date of Birth (DDMMYYYY)"
              : 'Use the password provided by your administrator'}
          </Text>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In as {isParent ? 'Parent' : 'Faculty'}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  banner: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.emerald, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.emerald, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  schoolName: { color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: theme.textSub, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: theme.surface, borderRadius: theme.radiusLg, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: theme.border,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: theme.bg,
    borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.border,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: theme.emerald },
  tabText: { color: theme.textSub, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  label: { color: theme.textSub, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.bg, borderRadius: 12,
    borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 13 },
  hint: { color: theme.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 20, lineHeight: 16 },
  btn: {
    backgroundColor: theme.emerald, borderRadius: theme.radius,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: theme.emerald, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
