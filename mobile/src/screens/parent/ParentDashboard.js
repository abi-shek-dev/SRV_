import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function ParentDashboard() {
  const { user, authHeaders, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [cafeteria, setCafeteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const h = authHeaders();
      const [studentRes, annRes, cafRes] = await Promise.all([
        axios.get(`${API_URL}/api/parent/student`, { headers: h }),
        axios.get(`${API_URL}/api/parent/announcements`, { headers: h }),
        axios.get(`${API_URL}/api/parent/cafeteria`, { headers: h }),
      ]);
      setStudent(studentRes.data);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data.slice(0, 3) : []);
      setCafeteria(Array.isArray(cafRes.data) ? cafRes.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const todayMenu = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return cafeteria.find(m => m.day === today);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;
  }

  const menu = todayMenu();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name || 'Parent'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Student Card */}
      {student && (
        <View style={styles.studentCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.name?.[0] || 'S'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentSub}>Grade {student.grade} - {student.section}</Text>
            <Text style={styles.studentSub}>{student.srvNumber}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: student.fees?.overall === 'Paid' ? '#166534' : '#7c2d12' }]}>
            <Text style={styles.badgeText}>{student.fees?.overall || 'Unpaid'}</Text>
          </View>
        </View>
      )}

      {/* Today's Menu */}
      {menu && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Cafeteria</Text>
          <View style={styles.menuCard}>
            <MenuItem label="Breakfast" value={menu.breakfast} icon="sunny-outline" />
            <MenuItem label="Lunch" value={menu.lunch} icon="restaurant-outline" />
            <MenuItem label="Snacks" value={menu.snacks} icon="cafe-outline" />
          </View>
        </View>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Announcements</Text>
          {announcements.map((a, i) => (
            <View key={a._id || i} style={styles.annCard}>
              <Text style={styles.annTitle}>{a.title}</Text>
              <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
              <Text style={styles.annDate}>{new Date(a.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MenuItem({ label, value, icon }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Ionicons name={icon} size={16} color="#6366f1" style={{ marginRight: 8 }} />
      <Text style={{ color: '#94a3b8', fontSize: 12, width: 70 }}>{label}</Text>
      <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: '600', flex: 1 }}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 56,
  },
  greeting: { color: '#64748b', fontSize: 13 },
  name: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },
  studentCard: {
    margin: 16, padding: 16, backgroundColor: '#1e293b',
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  studentName: { color: '#f1f5f9', fontWeight: '700', fontSize: 15 },
  studentSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  menuCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' },
  annCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#334155',
  },
  annTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  annBody: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  annDate: { color: '#475569', fontSize: 11, marginTop: 6 },
});
