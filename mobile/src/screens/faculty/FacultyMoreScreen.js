import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

export default function FacultyMoreScreen() {
  const { logout, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('behavior');
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Behavior form
  const [behaviorStudent, setBehaviorStudent] = useState('');
  const [behaviorScore, setBehaviorScore] = useState('');
  const [behaviorRemarks, setBehaviorRemarks] = useState('');

  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', body: '' });

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/faculty/students`, { headers: h }).then(r => setStudents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/events`, { headers: h }).then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/polls`, { headers: h }).then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/memories`, { headers: h }).then(r => setMemories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/announcements`, { headers: h }).then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const submitBehavior = async () => {
    if (!behaviorStudent || !behaviorScore) return Alert.alert('Missing fields', 'Select a student and enter a score.');
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/behavior`, {
        date: new Date().toISOString().split('T')[0],
        records: [{ studentId: behaviorStudent, score: Number(behaviorScore), remarks: behaviorRemarks }]
      }, { headers: authHeaders() });
      Alert.alert('Saved!', 'Behavior log saved.');
      setBehaviorStudent(''); setBehaviorScore(''); setBehaviorRemarks('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save.');
    } finally { setSubmitting(false); }
  };

  const submitAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.body.trim()) return Alert.alert('Missing fields', 'Title and body are required.');
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/announcements`, annForm, { headers: authHeaders() });
      setAnnForm({ title: '', body: '' }); setShowAnnForm(false);
      const r = await axios.get(`${API_URL}/api/faculty/announcements`, { headers: authHeaders() });
      setAnnouncements(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post.');
    } finally { setSubmitting(false); }
  };

  const TABS = [
    { id: 'behavior', label: 'Behavior', icon: 'star-outline' },
    { id: 'announcements', label: 'Posts', icon: 'megaphone-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'polls', label: 'Polls', icon: 'bar-chart-outline' },
    { id: 'memories', label: 'Memories', icon: 'images-outline' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, activeTab === t.id && styles.tabActive]} onPress={() => setActiveTab(t.id)}>
            <Ionicons name={t.icon} size={13} color={activeTab === t.id ? '#fff' : theme.textSub} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* BEHAVIOR */}
        {activeTab === 'behavior' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log Behavior</Text>
            <Text style={styles.fieldLabel}>Select Student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {students.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.chip, behaviorStudent === s._id && styles.chipActive]}
                    onPress={() => setBehaviorStudent(s._id)}
                  >
                    <Text style={[styles.chipText, behaviorStudent === s._id && styles.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.fieldLabel}>Score (1–10)</Text>
            <TextInput style={styles.input} value={behaviorScore} onChangeText={setBehaviorScore} keyboardType="numeric" placeholder="e.g. 8" placeholderTextColor={theme.textMuted} maxLength={2} />
            <Text style={styles.fieldLabel}>Remarks (optional)</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={behaviorRemarks} onChangeText={setBehaviorRemarks} placeholder="Any remarks..." placeholderTextColor={theme.textMuted} multiline />
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitBehavior} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Save Behavior Log</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAnnForm(v => !v)}>
              <Ionicons name={showAnnForm ? 'close' : 'add'} size={16} color="#fff" />
              <Text style={styles.addBtnText}>{showAnnForm ? 'Cancel' : 'New Announcement'}</Text>
            </TouchableOpacity>
            {showAnnForm && (
              <View style={[styles.formCard, { marginTop: 12 }]}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput style={styles.input} value={annForm.title} onChangeText={v => setAnnForm(f => ({ ...f, title: v }))} placeholder="Announcement title" placeholderTextColor={theme.textMuted} />
                <Text style={styles.fieldLabel}>Body</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={annForm.body} onChangeText={v => setAnnForm(f => ({ ...f, body: v }))} placeholder="Write announcement..." placeholderTextColor={theme.textMuted} multiline />
                <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitAnnouncement} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Post Announcement</Text>}
                </TouchableOpacity>
              </View>
            )}
            {announcements.map((a, i) => (
              <View key={a._id || i} style={[styles.card, { marginTop: 10 }]}>
                <View style={styles.annStripe} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardDesc}>{a.body}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0 ? <EmptyState icon="calendar-outline" text="No events" /> :
          events.map((e, i) => (
            <View key={e._id || i} style={[styles.card, { marginBottom: 10 }]}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardSub}>{new Date(e.date).toLocaleDateString()}</Text>
              {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
            </View>
          ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0 ? <EmptyState icon="bar-chart-outline" text="No polls" /> :
          polls.map((p, i) => (
            <View key={p._id || i} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.cardTitle}>{p.question}</Text>
              {(p.options || []).map((opt, idx) => (
                <View key={idx} style={styles.pollOption}>
                  <Text style={styles.cardDesc}>{opt.text || opt}</Text>
                  <Text style={styles.pollCount}>{opt.votes || 0} votes</Text>
                </View>
              ))}
            </View>
          ))
        )}

        {/* MEMORIES */}
        {activeTab === 'memories' && (
          memories.length === 0 ? <EmptyState icon="images-outline" text="No memories" /> :
          memories.map((m, i) => (
            <View key={m._id || i} style={[styles.memCard, { marginBottom: 12 }]}>
              {m.resourceType === 'image' && <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />}
              <View style={{ padding: 12 }}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  tabActive: { backgroundColor: theme.amber, borderColor: theme.amber },
  tabText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  formTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  fieldLabel: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 14, marginBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
  chipActive: { backgroundColor: theme.amber, borderColor: theme.amber },
  chipText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: theme.amber, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.amber, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  annStripe: { width: 3, borderRadius: 2, backgroundColor: theme.amber },
  cardTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardSub: { color: theme.textSub, fontSize: 12, marginBottom: 4 },
  cardDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, flex: 1 },
  pollOption: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.bg, borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: theme.border },
  pollCount: { color: theme.textMuted, fontSize: 12 },
  memCard: { backgroundColor: theme.surface, borderRadius: theme.radius, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memImage: { width: '100%', height: 180 },
});
