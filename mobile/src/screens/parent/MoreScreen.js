import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

export default function MoreScreen() {
  const { user, logout, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('fees');
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

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
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Ionicons name={t.icon} size={13} color={activeTab === t.id ? '#fff' : theme.textSub} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* FEES */}
        {activeTab === 'fees' && student && (
          <View style={{ gap: 10 }}>
            <FeeTerm label="Term 1" status={student.fees?.term1} amount={student.fees?.term1Amount} paid={student.fees?.term1Paid} />
            <FeeTerm label="Term 2" status={student.fees?.term2} amount={student.fees?.term2Amount} paid={student.fees?.term2Paid} />
            <FeeTerm label="Term 3" status={student.fees?.term3} amount={student.fees?.term3Amount} paid={student.fees?.term3Paid} />
            {student.fees?.additionalFees > 0 && (
              <FeeTerm label="Additional" status={student.fees?.additionalFees <= student.fees?.additionalPaid ? 'Paid' : 'Unpaid'} amount={student.fees?.additionalFees} paid={student.fees?.additionalPaid} />
            )}
            <View style={[styles.overallBadge,
              { backgroundColor: student.fees?.overall === 'Paid' ? theme.emeraldBg : theme.errorBg,
                borderColor: student.fees?.overall === 'Paid' ? theme.emeraldBorder : '#fca5a5' }
            ]}>
              <Text style={[styles.overallText, { color: student.fees?.overall === 'Paid' ? theme.emerald : theme.error }]}>
                Overall: {student.fees?.overall || 'Unpaid'}
              </Text>
            </View>
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0 ? <EmptyState icon="calendar-outline" text="No upcoming events" /> :
          events.map((e, i) => (
            <View key={e._id || i} style={styles.card}>
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDay}>{new Date(e.date).getDate()}</Text>
                <Text style={styles.eventMonth}>{new Date(e.date).toLocaleString('default', { month: 'short' })}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
              </View>
            </View>
          ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0 ? <EmptyState icon="bar-chart-outline" text="No active polls" /> :
          polls.map((p, i) => (
            <View key={p._id || i} style={[styles.card, { marginBottom: 12 }]}>
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
          memories.length === 0 ? <EmptyState icon="images-outline" text="No memories yet" /> :
          memories.map((m, i) => (
            <View key={m._id || i} style={[styles.memCard, { marginBottom: 12 }]}>
              {m.resourceType === 'image' && (
                <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />
              )}
              <View style={{ padding: 12 }}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
                <TouchableOpacity style={styles.dlBtn} onPress={() => Linking.openURL(m.secureUrl.replace('/upload/', '/upload/fl_attachment/'))}>
                  <Ionicons name="download-outline" size={13} color={theme.emerald} />
                  <Text style={styles.dlText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* FEEDBACK */}
        {activeTab === 'feedback' && (
          feedbacks.length === 0 ? <EmptyState icon="chatbubble-outline" text="No feedback yet" /> :
          feedbacks.map((fb, i) => (
            <View key={fb._id || i} style={[styles.card, { marginBottom: 10 }]}>
              <Text style={styles.cardTitle}>{fb.subject || 'Feedback'}</Text>
              <Text style={styles.cardDesc}>{fb.message}</Text>
              <Text style={styles.cardDate}>{new Date(fb.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function FeeTerm({ label, status, amount, paid }) {
  const isPaid = status === 'Paid';
  const isPartial = status === 'Partial';
  const color = isPaid ? theme.emerald : isPartial ? theme.amber : theme.error;
  const bg = isPaid ? theme.emeraldBg : isPartial ? theme.amberBg : theme.errorBg;
  const border = isPaid ? theme.emeraldBorder : isPartial ? theme.amberBorder : '#fca5a5';
  return (
    <View style={styles.feeCard}>
      <Text style={styles.feeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.feeAmount}>₹{Number(paid || 0).toLocaleString()} <Text style={styles.feeTotal}>/ ₹{Number(amount || 0).toLocaleString()}</Text></Text>
      </View>
      <View style={[styles.feeBadge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.feeBadgeText, { color }]}>{status || 'Unpaid'}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon, text }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, gap: 12 }}>
      <Ionicons name={icon} size={40} color={theme.border} />
      <Text style={{ color: theme.textMuted, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  logoutBtn: { padding: 8, backgroundColor: theme.errorBg, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5' },
  tabBar: { flexGrow: 0, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  tabActive: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  tabText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 8 },
  cardTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
  cardDate: { color: theme.textMuted, fontSize: 11, marginTop: 6 },
  eventDateBadge: { backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 44, borderWidth: 1, borderColor: theme.emeraldBorder },
  eventDay: { color: theme.emerald, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  eventMonth: { color: theme.emerald, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pollOption: { backgroundColor: theme.bg, borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  pollOptionVoted: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  pollOptionText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  memCard: { backgroundColor: theme.surface, borderRadius: theme.radius, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memImage: { width: '100%', height: 180 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  dlText: { color: theme.emerald, fontSize: 13, fontWeight: '600' },
  feeCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  feeLabel: { color: theme.textSub, fontSize: 13, fontWeight: '600', width: 72 },
  feeAmount: { color: theme.text, fontSize: 13, fontWeight: '700' },
  feeTotal: { color: theme.textMuted, fontWeight: '400' },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  feeBadgeText: { fontSize: 11, fontWeight: '700' },
  overallBadge: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  overallText: { fontWeight: '800', fontSize: 15 },
});
