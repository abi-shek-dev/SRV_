import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function StudentsScreen() {
  const { authHeaders } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/faculty/students`, { headers: authHeaders() });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchStudents(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchStudents(); };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.srvNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;
  }

  if (selectedStudent) {
    return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} authHeaders={authHeaders} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
        <Text style={styles.subtitle}>{filtered.length} of {students.length}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or SRV..."
          placeholderTextColor="#475569"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#334155" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          filtered.map(s => (
            <TouchableOpacity key={s._id} style={styles.card} onPress={() => setSelectedStudent(s)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{s.name?.[0] || 'S'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentSub}>{s.srvNumber} · Grade {s.grade}-{s.section}</Text>
                {s.parentMobileNumber ? (
                  <Text style={styles.studentSub}>{s.parentMobileNumber}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StudentDetail({ student, onBack, authHeaders }) {
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [behavior, setBehavior] = useState([]);

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/faculty/marks/${student._id}`, { headers: h }).then(r => setMarks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/attendance/${student._id}`, { headers: h }).then(r => setAttendance(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/behavior/${student._id}`, { headers: h }).then(r => setBehavior(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [student._id]);

  const pct = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100) : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#f1f5f9" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{student.name}</Text>
          <Text style={styles.subtitle}>{student.srvNumber}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <DetailRow label="Grade" value={`${student.grade} - ${student.section}`} />
        <DetailRow label="DOB" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'} />
        <DetailRow label="Father" value={student.fatherName || '—'} />
        <DetailRow label="Mother" value={student.motherName || '—'} />
        <DetailRow label="Mobile" value={student.parentMobileNumber || '—'} />
        <DetailRow label="Attendance" value={`${pct}%`} />
      </View>

      {marks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Records</Text>
          {marks.map((m, i) => (
            <View key={i} style={styles.markRow}>
              <Text style={styles.markSubject}>{m.subject}</Text>
              <Text style={styles.markScore}>{m.score}/{m.maxScore || 100}</Text>
            </View>
          ))}
        </View>
      )}

      {behavior.slice(0, 5).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Behavior</Text>
          {behavior.slice(0, 5).map((b, i) => (
            <View key={i} style={styles.markRow}>
              <Text style={styles.markSubject}>{new Date(b.date).toLocaleDateString()}</Text>
              <Text style={[styles.markScore, { color: b.score >= 7 ? '#4ade80' : b.score >= 4 ? '#fbbf24' : '#f87171' }]}>{b.score}/10</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#475569', fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155', gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  studentName: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
  studentSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  detailCard: { margin: 16, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  detailLabel: { color: '#64748b', fontSize: 13 },
  detailValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  markRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  markSubject: { color: '#cbd5e1', fontSize: 13 },
  markScore: { color: '#f1f5f9', fontWeight: '700', fontSize: 13 },
});
