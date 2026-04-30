import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function AttendanceScreen() {
  const { authHeaders } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/parent/attendance`, { headers: authHeaders() });
      const data = Array.isArray(res.data) ? res.data : [];
      setRecords(data.slice(0, 30));
      const present = data.filter(r => r.status === 'Present').length;
      const absent = data.filter(r => r.status === 'Absent').length;
      setSummary({ present, absent, total: data.length });
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAttendance(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAttendance(); };

  const pct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <StatCard label="Present" value={summary.present} color="#4ade80" icon="checkmark-circle" />
        <StatCard label="Absent" value={summary.absent} color="#f87171" icon="close-circle" />
        <StatCard label="Rate" value={`${pct}%`} color="#60a5fa" icon="trending-up" />
      </View>

      {/* Progress bar */}
      <View style={styles.barWrap}>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pct >= 75 ? '#4ade80' : '#f87171' }]} />
        </View>
        <Text style={styles.barLabel}>{pct}% attendance this term</Text>
      </View>

      {/* Records list */}
      <Text style={styles.sectionTitle}>Recent Records</Text>
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color="#334155" />
          <Text style={styles.emptyText}>No attendance records yet</Text>
        </View>
      ) : (
        records.map((r, i) => (
          <View key={r._id || i} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: r.status === 'Present' ? '#4ade80' : r.status === 'Absent' ? '#f87171' : '#fbbf24' }]} />
            <Text style={styles.date}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
            <Text style={[styles.status, { color: r.status === 'Present' ? '#4ade80' : r.status === 'Absent' ? '#f87171' : '#fbbf24' }]}>{r.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  barWrap: { paddingHorizontal: 16, marginBottom: 20 },
  barBg: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: '#475569', fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  date: { color: '#cbd5e1', fontSize: 13, flex: 1 },
  status: { fontSize: 13, fontWeight: '700' },
});
