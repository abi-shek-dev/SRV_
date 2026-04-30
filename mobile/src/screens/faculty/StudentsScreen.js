import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

export default function StudentsScreen() {
  const { authHeaders } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

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

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.amber} size="large" /></View>;
  if (selected) return <StudentDetail student={selected} onBack={() => setSelected(null)} authHeaders={authHeaders} />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
        <Text style={styles.subtitle}>{filtered.length} of {students.length}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or SRV ID..."
          placeholderTextColor={theme.textMuted}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={theme.textMuted} /></TouchableOpacity> : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.amber} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={theme.border} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          filtered.map(s => (
            <TouchableOpacity key={s._id} style={styles.card} onPress={() => setSelected(s)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{s.name?.[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentSub}>{s.srvNumber} · Grade {s.grade}-{s.section}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{student.name}</Text>
          <Text style={styles.subtitle}>{student.srvNumber}</Text>
        </View>
      </View>
      <View style={styles.detailCard}>
        <DetailRow label="Grade" value={`${student.grade} – ${student.section}`} />
        <DetailRow label="DOB" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'} />
        <DetailRow label="Father" value={student.fatherName || '—'} />
        <DetailRow label="Mother" value={student.motherName || '—'} />
        <DetailRow label="Mobile" value={student.parentMobileNumber || '—'} />
        <DetailRow label="Attendance" value={`${pct}%`} last />
      </View>
      {marks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Records</Text>
          <View style={styles.detailCard}>
            {marks.map((m, i) => (
              <DetailRow key={i} label={m.subject} value={`${m.score}/${m.maxScore || 100}`} last={i === marks.length - 1} />
            ))}
          </View>
        </View>
      )}
      {behavior.slice(0, 5).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Behavior</Text>
          <View style={styles.detailCard}>
            {behavior.slice(0, 5).map((b, i) => (
              <DetailRow key={i} label={new Date(b.date).toLocaleDateString()} value={`${b.score}/10`} last={i === 4} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 56, gap: 12 },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  backBtn: { padding: 8, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, color: theme.text, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: theme.textMuted, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.amber, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  studentName: { color: theme.text, fontWeight: '700', fontSize: 14 },
  studentSub: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  detailCard: { marginHorizontal: 16, backgroundColor: theme.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  detailLabel: { color: theme.textSub, fontSize: 13 },
  detailValue: { color: theme.text, fontSize: 13, fontWeight: '600' },
  section: { marginTop: 16 },
  sectionTitle: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 10 },
});
