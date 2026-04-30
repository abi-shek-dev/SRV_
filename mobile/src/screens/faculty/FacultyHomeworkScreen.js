import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function FacultyHomeworkScreen() {
  const { authHeaders } = useAuth();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', description: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchHomework = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/faculty/homework`, { headers: authHeaders() });
      setHomeworkList(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchHomework(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchHomework(); };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.subject.trim()) {
      Alert.alert('Missing fields', 'Title and subject are required.');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/homework`, form, { headers: authHeaders() });
      setForm({ title: '', subject: '', description: '', deadline: '' });
      setShowForm(false);
      fetchHomework();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not create homework.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Homework', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/faculty/homework/${id}`, { headers: authHeaders() });
            fetchHomework();
          } catch (_) {}
        }
      }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(v => !v)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <FormField label="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Homework title" />
          <FormField label="Subject *" value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))} placeholder="Subject" />
          <FormField label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional description" multiline />
          <FormField label="Deadline (YYYY-MM-DD)" value={form.deadline} onChangeText={v => setForm(f => ({ ...f, deadline: v }))} placeholder="2025-06-01" />
          <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Create Homework</Text>}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {homeworkList.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color="#334155" />
            <Text style={styles.emptyText}>No homework created yet</Text>
          </View>
        ) : (
          homeworkList.map(hw => (
            <View key={hw._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.subject}>{hw.subject}</Text>
                <TouchableOpacity onPress={() => handleDelete(hw._id)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hwTitle}>{hw.title}</Text>
              {hw.description ? <Text style={styles.hwDesc}>{hw.description}</Text> : null}
              {hw.deadline && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.meta}>Due: {new Date(hw.deadline).toLocaleDateString()}</Text>
                </View>
              )}
              {hw.submissionCount !== undefined && (
                <Text style={styles.meta}>{hw.submissionCount} submission{hw.submissionCount !== 1 ? 's' : ''}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  addBtn: { backgroundColor: '#3b82f6', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  form: { backgroundColor: '#1e293b', margin: 16, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    paddingHorizontal: 12, paddingVertical: 10, color: '#f1f5f9', fontSize: 14,
  },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#475569', fontSize: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subject: { color: '#3b82f6', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hwTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hwDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  meta: { color: '#64748b', fontSize: 12 },
});
