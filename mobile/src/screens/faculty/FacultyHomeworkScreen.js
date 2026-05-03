import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';
import CustomCalendarPicker from '../../components/CustomCalendarPicker';

export default function FacultyHomeworkScreen() {
  const { authHeaders } = useAuth();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', description: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

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
    if (!form.title.trim() || !form.subject.trim() || !form.deadline.trim()) {
      Alert.alert('Missing fields', 'Title, subject, and deadline are required.');
      return;
    }
    
    // Parse deadline
    const dDate = new Date(form.deadline);
    if (isNaN(dDate.getTime())) {
      Alert.alert('Invalid Date', 'Please use a valid YYYY-MM-DD format.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        subject: form.subject,
        description: form.description,
        dueDate: dDate.toISOString(),
        submissionDeadline: new Date(dDate.setHours(23, 59, 59, 999)).toISOString()
      };
      
      await axios.post(`${API_URL}/api/faculty/homework`, payload, { headers: authHeaders() });
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
    Alert.alert('Delete Homework', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await axios.delete(`${API_URL}/api/faculty/homework/${id}`, { headers: authHeaders() }); fetchHomework(); } catch (_) {}
      }}
    ]);
  };

  if (loading) return <LoadingOverlay visible={true} message="Loading homework..." />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(v => !v)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color="#fff" />
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'New'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.amber} />}
      >
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Homework</Text>
            <FormField label="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Homework title" />
            <FormField label="Subject *" value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))} placeholder="e.g. Mathematics" />
            <FormField label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional description" multiline />
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fieldLabel}>Deadline *</Text>
              <TouchableOpacity 
                style={[styles.input, { justifyContent: 'center' }]} 
                onPress={() => setShowCalendar(true)}
              >
                <Text style={{ color: form.deadline ? theme.text : theme.textMuted }}>
                  {form.deadline || "Select Date"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Create Homework</Text>}
            </TouchableOpacity>
          </View>
        )}

        {homeworkList.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color={theme.border} />
            <Text style={styles.emptyText}>No homework created yet</Text>
          </View>
        ) : (
          homeworkList.map(hw => (
            <View key={hw._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectPill}>
                  <Text style={styles.subjectText}>{hw.subject}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(hw._id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={15} color={theme.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hwTitle}>{hw.title}</Text>
              {hw.description ? <Text style={styles.hwDesc}>{hw.description}</Text> : null}
              {hw.deadline && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
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
      
      <CustomCalendarPicker 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        onSelect={(date) => setForm(f => ({ ...f, deadline: date }))}
        initialDate={form.deadline}
      />
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.amber, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  formTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  fieldLabel: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 14 },
  submitBtn: { backgroundColor: theme.amber, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: theme.textMuted, fontSize: 14 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectPill: { backgroundColor: theme.amberBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.amberBorder },
  subjectText: { color: theme.amber, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { padding: 6, backgroundColor: theme.errorBg, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  hwTitle: { color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hwDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
  meta: { color: theme.textMuted, fontSize: 12 },
});
