import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

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
    if (s >= 8) return '#4ade80';
    if (s >= 5) return '#fbbf24';
    return '#f87171';
  };

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
        <Text style={styles.title}>Behavior</Text>
        <Text style={styles.subtitle}>Score out of 10</Text>
      </View>

      {/* Avg score card */}
      <View style={styles.avgCard}>
        <Text style={styles.avgValue}>{avg}</Text>
        <Text style={styles.avgLabel}>Average Score</Text>
        <Text style={styles.avgSub}>{records.length} records total</Text>
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={40} color="#334155" />
          <Text style={styles.emptyText}>No behavior records yet</Text>
        </View>
      ) : (
        records.map((r, i) => (
          <View key={r._id || i} style={styles.card}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreText, { color: scoreColor(r.score) }]}>{r.score}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateText}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
              {r.remarks ? <Text style={styles.remarks}>{r.remarks}</Text> : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  avgCard: {
    margin: 16, backgroundColor: '#1e293b', borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  avgValue: { color: '#f1f5f9', fontSize: 48, fontWeight: '900' },
  avgLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 4 },
  avgSub: { color: '#475569', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: '#475569', fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginBottom: 10, backgroundColor: '#1e293b', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#334155', gap: 14,
  },
  scoreCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center',
  },
  scoreText: { fontSize: 18, fontWeight: '900' },
  dateText: { color: '#f1f5f9', fontWeight: '600', fontSize: 13 },
  remarks: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
