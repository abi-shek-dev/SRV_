import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Alert, Image, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function FacultyMoreScreen() {
  const { user, logout, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('behavior');
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [behaviorStudent, setBehaviorStudent] = useState('');
  const [behaviorScore, setBehaviorScore] = useState('');
  const [behaviorRemarks, setBehaviorRemarks] = useState('');

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/faculty/students`, { headers: h }).then(r => setStudents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/events`, { headers: h }).then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/polls`, { headers: h }).then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/memories`, { headers: h }).then(r => setMemories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/announcements`, { headers: h }).then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const submitBehavior = async () => {
    if (!behaviorStudent || !behaviorScore) {
      Alert.alert('Missing fields', 'Select a student and enter a score.');
      return;
    }
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
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.body.trim()) {
      Alert.alert('Missing fields', 'Title and body are required.');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/announcements`, annForm, { headers: authHeaders() });
      setAnnForm({ title: '', body: '' });
      setShowAnnForm(false);
      const r = await axios.get(`${API_URL}/api/faculty/announcements`, { headers: authHeaders() });
      setAnnouncements(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post announcement.');
    } finally {
      setSubmitting(false);
    }
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
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, activeTab === t.id && styles.tabActive]} onPress={() => setActiveTab(t.id)}>
            <Ionicons name={t.icon} size={14} color={activeTab === t.id ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* BEHAVIOR */}
        {activeTab === 'behavior' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.formLabel}>Student</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {students.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.studentChip, behaviorStudent === s._id && styles.studentChipActive]}
                    onPress={() => setBehaviorStudent(s._id)}
                  >
                    <Text style={[styles.studentChipText, behaviorStudent === s._id && { color: '#fff' }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.formLabel}>Score (1-10)</Text>
              <TextInput
                style={styles.input}
                value={behaviorScore}
                onChangeText={setBehaviorScore}
                keyboardType="numeric"
                placeholder="e.g. 8"
                placeholderTextColor="#475569"
                maxLength={2}
              />
              <Text style={styles.formLabel}>Remarks (optional)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={behaviorRemarks}
                onChangeText={setBehaviorRemarks}
                placeholder="Any remarks..."
                placeholderTextColor="#475569"
                multiline
              />
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitBehavior} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Log Behavior</Text>}
              </TouchableOpacity>
            </View>
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
              <View style={[styles.card, { marginTop: 12 }]}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput style={styles.input} value={annForm.title} onChangeText={v => setAnnForm(f => ({ ...f, title: v }))} placeholder="Announcement title" placeholderTextColor="#475569" />
                <Text style={styles.formLabel}>Body</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={annForm.body} onChangeText={v => setAnnForm(f => ({ ...f, body: v }))} placeholder="Write announcement..." placeholderTextColor="#475569" multiline />
                <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitAnnouncement} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Post Announcement</Text>}
                </TouchableOpacity>
              </View>
            )}
            {announcements.map((a, i) => (
              <View key={a._id || i} style={[styles.card, { marginTop: 10 }]}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardDesc}>{a.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0
            ? <EmptyState icon="calendar-outline" text="No events" />
            : events.map((e, i) => (
              <View key={e._id || i} style={styles.card}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                <Text style={styles.cardSub}>{new Date(e.date).toLocaleDateString()}</Text>
                {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
              </View>
            ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0
            ? <EmptyState icon="bar-chart-outline" text="No polls" />
            : polls.map((p, i) => (
              <View key={p._id || i} style={styles.card}>
                <Text style={styles.cardTitle}>{p.question}</Text>
                {(p.options || []).map((opt, idx) => (
                  <View key={idx} style={styles.pollOption}>
                    <Text style={styles.pollOptionText}>{opt.text || opt}</Text>
                    <Text style={styles.pollCount}>{opt.votes || 0} votes</Text>
                  </View>
                ))}
              </View>
            ))
        )}

        {/* MEMORIES */}
        {activeTab === 'memories' && (
          memories.length === 0
            ? <EmptyState icon="images-outline" text="No memories" />
            : memories.map((m, i) => (
              <View key={m._id || i} style={styles.memCard}>
                {m.resourceType === 'image' && (
                  <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />
                )}
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
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 10, color: '#f1f5f9', fontSize: 14 },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  studentChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', marginRight: 8 },
  studentChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  studentChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardSub: { color: '#64748b', fontSize: 12 },
  cardDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginTop: 4 },
  pollOption: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', borderRadius: 8, padding: 10, marginTop: 6 },
  pollOptionText: { color: '#cbd5e1', fontSize: 13 },
  pollCount: { color: '#64748b', fontSize: 12 },
  memCard: { backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  memImage: { width: '100%', height: 180 },
});
