import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

const STATUS_OPTIONS = [
  { key: 'Present', label: 'P', color: theme.emerald, bg: theme.emeraldBg, border: theme.emeraldBorder },
  { key: 'Absent', label: 'A', color: theme.error, bg: theme.errorBg, border: '#fca5a5' },
  { key: 'Late', label: 'L', color: theme.amber, bg: theme.amberBg, border: theme.amberBorder },
];

export default function FacultyAttendanceScreen() {
  const { authHeaders } = useAuth();
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const recordsArray = students.map(s => ({ studentId: s._id, status: records[s._id] || 'Present', remarks: '' }));
      await axios.post(`${API_URL}/api/faculty/attendance`, { date, records: recordsArray }, { headers: authHeaders() });
      setSubmitted(true);
      Alert.alert('Saved!', 'Attendance submitted successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.amber} size="large" /></View>;

  const presentCount = Object.values(records).filter(s => s === 'Present').length;
  const absentCount = Object.values(records).filter(s => s === 'Absent').length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={13} color={theme.amber} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: theme.emeraldBg, borderColor: theme.emeraldBorder }]}>
          <Text style={[styles.summaryNum, { color: theme.emerald }]}>{presentCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.emerald }]}>Present</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: theme.errorBg, borderColor: '#fca5a5' }]}>
          <Text style={[styles.summaryNum, { color: theme.error }]}>{absentCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.error }]}>Absent</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: theme.amberBg, borderColor: theme.amberBorder }]}>
          <Text style={[styles.summaryNum, { color: theme.amber }]}>{students.length - presentCount - absentCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.amber }]}>Late</Text>
        </View>
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
              {STATUS_OPTIONS.map(opt => {
                const active = records[s._id] === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.statusBtn,
                      { borderColor: active ? opt.border : theme.border,
                        backgroundColor: active ? opt.bg : theme.bg }
                    ]}
                    onPress={() => setRecords(r => ({ ...r, [s._id]: opt.key }))}
                  >
                    <Text style={[styles.statusBtnText, { color: active ? opt.color : theme.textMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || submitted) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || submitted}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name={submitted ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{submitted ? 'Submitted' : 'Submit Attendance'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.amberBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.amberBorder },
  dateText: { color: theme.amber, fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  summaryChip: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  summaryNum: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radius, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.amber, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  studentName: { color: theme.text, fontWeight: '700', fontSize: 13 },
  studentSub: { color: theme.textSub, fontSize: 11 },
  statusRow: { flexDirection: 'row', gap: 5 },
  statusBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  statusBtnText: { fontSize: 11, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  submitBtn: { backgroundColor: theme.amber, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
