import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late'];
const STATUS_COLORS = { Present: '#4ade80', Absent: '#f87171', Late: '#fbbf24' };

export default function FacultyAttendanceScreen() {
  const { authHeaders } = useAuth();
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/faculty/students`, { headers: authHeaders() });
        const list = Array.isArray(res.data) ? res.data : [];
        setStudents(list);
        const init = {};
        list.forEach(s => { init[s._id] = 'Present'; });
        setRecords(init);
      } catch (_) {}
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const setStatus = (id, status) => setRecords(r => ({ ...r, [id]: status }));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const recordsArray = students.map(s => ({
        studentId: s._id,
        status: records[s._id] || 'Present',
        remarks: ''
      }));
      await axios.post(`${API_URL}/api/faculty/attendance`, { date, records: recordsArray }, { headers: authHeaders() });
      setSubmitted(true);
      Alert.alert('Saved!', 'Attendance submitted successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;
  }

  const presentCount = Object.values(records).filter(s => s === 'Present').length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={13} color="#3b82f6" />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={{ color: '#4ade80', fontWeight: '800' }}>{presentCount}</Text> Present ·&nbsp;
          <Text style={{ color: '#f87171', fontWeight: '800' }}>{students.length - presentCount}</Text> Absent
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {students.map(s => (
          <View key={s._id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{s.name?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{s.name}</Text>
              <Text style={styles.studentSub}>{s.srvNumber}</Text>
            </View>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.statusBtn, records[s._id] === opt && { backgroundColor: STATUS_COLORS[opt] + '33', borderColor: STATUS_COLORS[opt] }]}
                  onPress={() => setStatus(s._id, opt)}
                >
                  <Text style={[styles.statusBtnText, records[s._id] === opt && { color: STATUS_COLORS[opt] }]}>{opt[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || submitted) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || submitted}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.submitBtnText}>{submitted ? 'Submitted ✓' : 'Submit Attendance'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dateText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
  summaryRow: { paddingHorizontal: 16, marginBottom: 8 },
  summaryText: { color: '#94a3b8', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  studentName: { color: '#f1f5f9', fontWeight: '700', fontSize: 13 },
  studentSub: { color: '#64748b', fontSize: 11 },
  statusRow: { flexDirection: 'row', gap: 4 },
  statusBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  statusBtnText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
