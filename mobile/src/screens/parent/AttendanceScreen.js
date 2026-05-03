import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

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
  const pctColor = pct >= 75 ? theme.emerald : theme.error;

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading attendance..." />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>{summary.total} days recorded</Text>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        <StatCard label="Present" value={summary.present} color={theme.emerald} bg={theme.emeraldBg} border={theme.emeraldBorder} icon="checkmark-circle-outline" />
        <StatCard label="Absent" value={summary.absent} color={theme.error} bg={theme.errorBg} border="#fca5a5" icon="close-circle-outline" />
        <StatCard label="Rate" value={`${pct}%`} color={pctColor} bg={pct >= 75 ? theme.emeraldBg : theme.errorBg} border={pct >= 75 ? theme.emeraldBorder : '#fca5a5'} icon="trending-up-outline" />
      </View>

      {/* Progress bar */}
      <View style={styles.barWrap}>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pctColor }]} />
        </View>
        <Text style={[styles.barLabel, { color: pctColor }]}>{pct}% attendance rate</Text>
      </View>

      {/* Records */}
      <Text style={styles.sectionTitle}>Recent Records</Text>
      <View style={styles.card}>
        {records.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={36} color={theme.border} />
            <Text style={styles.emptyText}>No records yet</Text>
          </View>
        ) : (
          records.map((r, i) => {
            const isPresent = r.status === 'Present';
            const isLate = r.status === 'Late';
            const color = isPresent ? theme.emerald : isLate ? theme.amber : theme.error;
            return (
              <View key={r._id || i} style={[styles.row, i < records.length - 1 && styles.rowBorder]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.date}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                <Text style={[styles.status, { color }]}>{r.status}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, bg, border, icon }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  statRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: theme.textSub, fontSize: 11, fontWeight: '600' },
  barWrap: { paddingHorizontal: 16, marginBottom: 20 },
  barBg: { height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 10 },
  card: { marginHorizontal: 16, backgroundColor: theme.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: theme.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  date: { color: theme.text, fontSize: 13, flex: 1 },
  status: { fontSize: 13, fontWeight: '700' },
});
