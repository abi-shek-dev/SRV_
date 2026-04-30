import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function FacultyDashboard() {
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
    return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Faculty Portal 📚</Text>
          <Text style={styles.name}>{user?.name || 'Faculty'}</Text>
          {user?.assignedGrade && (
            <Text style={styles.classTag}>Grade {user.assignedGrade} - {user.assignedSection || '—'}</Text>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        <StatCard icon="people" label="Students" value={stats.students} color="#3b82f6" />
        <StatCard icon="document-text" label="Homework" value={stats.homework} color="#8b5cf6" />
        <StatCard icon="megaphone" label="Posts" value={stats.announcements} color="#f59e0b" />
      </View>

      {/* Announcements */}
      {announcements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Announcements</Text>
          {announcements.map((a, i) => (
            <View key={a._id || i} style={styles.annCard}>
              <Text style={styles.annTitle}>{a.title}</Text>
              <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  greeting: { color: '#64748b', fontSize: 13 },
  name: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginTop: 2 },
  classTag: { color: '#3b82f6', fontSize: 12, fontWeight: '700', marginTop: 4 },
  logoutBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },
  statRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#64748b', fontSize: 10, fontWeight: '600' },
  section: { marginHorizontal: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  annCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  annTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  annBody: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
});
