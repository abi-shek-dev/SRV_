import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function FacultyDashboard() {
  const navigation = useNavigation();
  const { user, logout, authHeaders } = useAuth();
  const [stats, setStats] = useState({ students: 0, homework: 0, announcements: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const h = authHeaders();
      const [studRes, hwRes, annRes] = await Promise.all([
        axios.get(`${API_URL}/api/faculty/students`, { headers: h }),
        axios.get(`${API_URL}/api/faculty/homework`, { headers: h }),
        axios.get(`${API_URL}/api/faculty/announcements`, { headers: h }),
      ]);
      const students = Array.isArray(studRes.data) ? studRes.data : [];
      const hw = Array.isArray(hwRes.data) ? hwRes.data : [];
      const ann = Array.isArray(annRes.data) ? annRes.data : [];
      setStats({ students: students.length, homework: hw.length, announcements: ann.length });
      setAnnouncements(ann.slice(0, 3));
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.amber} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Faculty Portal 📚</Text>
          <Text style={styles.name}>{user?.name || 'Faculty'}</Text>
          {user?.assignedGrade && (
            <View style={styles.classPill}>
              <Ionicons name="school-outline" size={12} color={theme.amber} />
              <Text style={styles.classText}>Grade {user.assignedGrade}{user.assignedSection ? ` · ${user.assignedSection}` : ''}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        <StatCard icon="people-outline" label="Students" value={stats.students} color={theme.info} bg={theme.infoBg} border="#bfdbfe" onPress={() => navigation.navigate('Students')} />
        <StatCard icon="document-text-outline" label="Homework" value={stats.homework} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" onPress={() => navigation.navigate('Homework')} />
        <StatCard icon="megaphone-outline" label="Posts" value={stats.announcements} color={theme.amber} bg={theme.amberBg} border={theme.amberBorder} onPress={() => navigation.navigate('More')} />
      </View>

      {/* Announcements */}
      {announcements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Announcements</Text>
          {announcements.map((a, i) => (
            <View key={a._id || i} style={styles.annCard}>
              <View style={styles.annStripe} />
              <View style={{ flex: 1 }}>
                <Text style={styles.annTitle}>{a.title}</Text>
                <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, bg, border, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  greeting: { color: theme.textSub, fontSize: 13 },
  name: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  classPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: theme.amberBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: theme.amberBorder, alignSelf: 'flex-start' },
  classText: { color: theme.amber, fontSize: 11, fontWeight: '700' },
  logoutBtn: { padding: 8, backgroundColor: theme.errorBg, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5' },
  statRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: theme.textSub, fontSize: 10, fontWeight: '600' },
  section: { marginHorizontal: 16 },
  sectionTitle: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  annCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  annStripe: { width: 3, borderRadius: 2, backgroundColor: theme.amber },
  annTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  annBody: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
});
