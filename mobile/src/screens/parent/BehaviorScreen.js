import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function BehaviorScreen() {
  const { authHeaders } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBehavior = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/parent/behavior`, { headers: authHeaders() });
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBehavior(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchBehavior(); };

  const avg = records.length > 0
    ? (records.reduce((s, r) => s + (Number(r.score) || 0), 0) / records.length).toFixed(1)
    : '—';

  const scoreColor = (s) => {
    if (s >= 8) return theme.emerald;
    if (s >= 5) return theme.amber;
    return theme.error;
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading behavior..." />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Behavior</Text>
        <Text style={styles.subtitle}>Score out of 10</Text>
      </View>

      {/* Avg card */}
      <View style={styles.avgCard}>
        <Text style={styles.avgValue}>{avg}</Text>
        <Text style={styles.avgLabel}>Average Score</Text>
        <Text style={styles.avgSub}>{records.length} records total</Text>
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={40} color={theme.border} />
          <Text style={styles.emptyText}>No behavior records yet</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {records.map((r, i) => (
            <View key={r._id || i} style={[styles.row, i < records.length - 1 && styles.rowBorder]}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(r.score) + '44', backgroundColor: scoreColor(r.score) + '11' }]}>
                <Text style={[styles.scoreText, { color: scoreColor(r.score) }]}>{r.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateText}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                {r.remarks ? <Text style={styles.remarks}>{r.remarks}</Text> : null}
              </View>
              <Ionicons
                name={r.score >= 7 ? 'trending-up' : r.score >= 4 ? 'remove' : 'trending-down'}
                size={16}
                color={scoreColor(r.score)}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  avgCard: {
    margin: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLg, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avgValue: { color: theme.text, fontSize: 52, fontWeight: '900' },
  avgLabel: { color: theme.textSub, fontSize: 14, fontWeight: '600', marginTop: 4 },
  avgSub: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: theme.textMuted, fontSize: 14 },
  listCard: {
    marginHorizontal: 16, backgroundColor: theme.surface, borderRadius: theme.radius,
    borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  scoreCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 16, fontWeight: '900' },
  dateText: { color: theme.text, fontWeight: '600', fontSize: 13 },
  remarks: { color: theme.textSub, fontSize: 12, marginTop: 2 },
});
