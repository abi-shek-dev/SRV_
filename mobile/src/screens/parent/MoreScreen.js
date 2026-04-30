import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Linking, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function MoreScreen() {
  const { user, logout, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('fees');
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/parent/student`, { headers: h }).then(r => setStudent(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/parent/events`, { headers: h }).then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/polls`, { headers: h }).then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/memories`, { headers: h }).then(r => setMemories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/feedback`, { headers: h }).then(r => setFeedbacks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const submitVote = async (pollId, optionIdx) => {
    try {
      await axios.post(`${API_URL}/api/parent/polls/${pollId}/vote`, { optionIndex: optionIdx }, { headers: authHeaders() });
      const r = await axios.get(`${API_URL}/api/parent/polls`, { headers: authHeaders() });
      setPolls(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Vote failed', err.response?.data?.message || 'Could not submit vote.');
    }
  };

  const TABS = [
    { id: 'fees', label: 'Fees', icon: 'wallet-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'polls', label: 'Polls', icon: 'bar-chart-outline' },
    { id: 'memories', label: 'Memories', icon: 'images-outline' },
    { id: 'feedback', label: 'Feedback', icon: 'chatbubble-outline' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Ionicons name={t.icon} size={14} color={activeTab === t.id ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* FEES */}
        {activeTab === 'fees' && student && (
          <View style={styles.feesWrap}>
            <FeeTerm label="Term 1" status={student.fees?.term1} amount={student.fees?.term1Amount} paid={student.fees?.term1Paid} />
            <FeeTerm label="Term 2" status={student.fees?.term2} amount={student.fees?.term2Amount} paid={student.fees?.term2Paid} />
            <FeeTerm label="Term 3" status={student.fees?.term3} amount={student.fees?.term3Amount} paid={student.fees?.term3Paid} />
            {student.fees?.additionalFees > 0 && (
              <FeeTerm label="Additional" status={student.fees?.additionalFees <= student.fees?.additionalPaid ? 'Paid' : 'Unpaid'} amount={student.fees?.additionalFees} paid={student.fees?.additionalPaid} />
            )}
            <View style={[styles.overallBadge, { backgroundColor: student.fees?.overall === 'Paid' ? '#166534' : '#7c2d12' }]}>
              <Text style={styles.overallText}>Overall: {student.fees?.overall || 'Unpaid'}</Text>
            </View>
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0
            ? <EmptyState icon="calendar-outline" text="No upcoming events" />
            : events.map((e, i) => (
              <View key={e._id || i} style={styles.card}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                <Text style={styles.cardSub}>{new Date(e.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
                {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
              </View>
            ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0
            ? <EmptyState icon="bar-chart-outline" text="No active polls" />
            : polls.map((p, i) => (
              <View key={p._id || i} style={styles.card}>
                <Text style={styles.cardTitle}>{p.question}</Text>
                {(p.options || []).map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pollOption, p.userVote === idx && styles.pollOptionVoted]}
                    onPress={() => !p.userVote && submitVote(p._id, idx)}
                  >
                    <Text style={[styles.pollOptionText, p.userVote === idx && { color: '#fff' }]}>{opt.text || opt}</Text>
                    {p.userVote === idx && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            ))
        )}

        {/* MEMORIES */}
        {activeTab === 'memories' && (
          memories.length === 0
            ? <EmptyState icon="images-outline" text="No memories uploaded yet" />
            : memories.map((m, i) => (
              <View key={m._id || i} style={styles.memCard}>
                {m.resourceType === 'image' && (
                  <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />
                )}
                <View style={styles.memInfo}>
                  <Text style={styles.memTitle}>{m.title}</Text>
                  {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
                  <TouchableOpacity
                    style={styles.dlBtn}
                    onPress={() => Linking.openURL(m.secureUrl.replace('/upload/', '/upload/fl_attachment/'))}
                  >
                    <Ionicons name="download-outline" size={13} color="#6366f1" />
                    <Text style={styles.dlText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}

        {/* FEEDBACK */}
        {activeTab === 'feedback' && (
          <View>
            {feedbacks.length === 0
              ? <EmptyState icon="chatbubble-outline" text="No feedback submitted yet" />
              : feedbacks.map((fb, i) => (
                <View key={fb._id || i} style={styles.card}>
                  <Text style={styles.cardTitle}>{fb.subject || 'Feedback'}</Text>
                  <Text style={styles.cardDesc}>{fb.message}</Text>
                  <Text style={styles.cardSub}>{new Date(fb.createdAt).toLocaleDateString()}</Text>
                </View>
              ))
            }
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FeeTerm({ label, status, amount, paid }) {
  const color = status === 'Paid' ? '#4ade80' : status === 'Partial' ? '#fbbf24' : '#f87171';
  return (
    <View style={styles.feeCard}>
      <Text style={styles.feeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.feeAmount}>₹{Number(paid || 0).toLocaleString()} / ₹{Number(amount || 0).toLocaleString()}</Text>
      </View>
      <View style={[styles.feeBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={[styles.feeBadgeText, { color }]}>{status || 'Unpaid'}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon, text }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
      <Ionicons name={icon} size={40} color="#334155" />
      <Text style={{ color: '#475569', fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  logoutBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },
  tabBar: { flexGrow: 0, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  cardSub: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  feesWrap: { gap: 10 },
  feeCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#334155' },
  feeLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', width: 70 },
  feeAmount: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  feeBadgeText: { fontSize: 11, fontWeight: '700' },
  overallBadge: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  overallText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pollOption: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pollOptionVoted: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pollOptionText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  memCard: { backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  memImage: { width: '100%', height: 180 },
  memInfo: { padding: 14 },
  memTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  dlText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
});
