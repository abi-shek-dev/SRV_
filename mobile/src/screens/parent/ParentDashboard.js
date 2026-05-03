import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function ParentDashboard({ navigation }) {
  const { user, authHeaders, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [cafeteria, setCafeteria] = useState([]);
  const [homework, setHomework] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const h = authHeaders();
      const [dashRes, annRes] = await Promise.all([
        axios.get(`${API_URL}/api/parent/dashboard`, { headers: h }),
        axios.get(`${API_URL}/api/parent/announcements`, { headers: h })
      ]);
      setStudent(dashRes.data.student);
      setHomework(dashRes.data.homework || []);
      setRecords(dashRes.data.records || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data.slice(0, 3) : []);
      
      // Cafeteria in the dashboard response is just the single `food` object for today,
      // but the mobile app expects an array for todayMenu() to find.
      // Wait, let's just create an array with that one food object.
      setCafeteria(dashRes.data.food ? [dashRes.data.food] : []);
    } catch (err) {
      console.error('[ParentDashboard] Error fetching data:', err.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const todayMenu = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return cafeteria.find(m => m.day === days[new Date().getDay()]);
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading dashboard..." />;
  }

  const menu = todayMenu();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name || 'Parent'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* Student Card */}
      {student && (
        <View style={styles.studentCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.name?.[0] || 'S'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentSub}>Grade {student.grade} · Section {student.section}</Text>
            <Text style={styles.studentSub}>{student.srvNumber}</Text>
          </View>
          <View style={[styles.feesBadge,
            { backgroundColor: student.fees?.overall === 'Paid' ? theme.successBg : theme.errorBg,
              borderColor: student.fees?.overall === 'Paid' ? theme.emeraldBorder : '#fca5a5' }
          ]}>
            <Text style={[styles.feesBadgeText, { color: student.fees?.overall === 'Paid' ? theme.emerald : theme.error }]}>
              {student.fees?.overall || 'Unpaid'}
            </Text>
          </View>
        </View>
      )}

      {/* Pending Homework */}
      <Section title="Pending Homework">
        {!homework || homework.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color={theme.emerald} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>You're all caught up!</Text>
            <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 4 }}>No pending homework.</Text>
          </View>
        ) : (
          homework.map((hw, i) => (
            <TouchableOpacity key={hw._id || i} style={[styles.card, { marginBottom: 10, flexDirection: 'column', gap: 6 }]} onPress={() => navigation && navigation.navigate('Homework')}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="book" size={16} color={theme.emerald} />
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>{hw.subject}</Text>
                </View>
                {hw.dueDate && (
                  <View style={{ backgroundColor: theme.amberBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: theme.amberBorder }}>
                    <Text style={{ color: theme.amber, fontSize: 10, fontWeight: '700' }}>Due {new Date(hw.dueDate).toLocaleDateString()}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: theme.textSub, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>{hw.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </Section>

      {/* Marks & Report Card */}
      {records && records.length > 0 && (
        <Section title="Marks & Report Card">
          {records.slice(0, 1).map((term, ti) => (
            <View key={term._id || ti} style={[styles.card, { flexDirection: 'column', gap: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{term.termName || 'Recent Report'}</Text>
                <TouchableOpacity onPress={() => navigation && navigation.navigate('More', { screen: 'marks' })}>
                  <Text style={{ color: theme.emerald, fontSize: 12, fontWeight: '700' }}>View All →</Text>
                </TouchableOpacity>
              </View>
              {(term.subjects || []).map((sub, si) => (
                <View key={si} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ color: theme.textSub, fontSize: 13, flex: 1 }}>{sub.subjectName}</Text>
                  <Text style={{ color: sub.marksObtained >= sub.totalMarks * 0.35 ? theme.emerald : theme.error, fontWeight: '800', fontSize: 14 }}>
                    {sub.marksObtained}/{sub.totalMarks}
                  </Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>Total: {term.totalObtained}/{term.totalMax}</Text>
                <Text style={{ color: theme.amber, fontWeight: '700', fontSize: 12 }}>Grade: {term.grade || '-'}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Today's Cafeteria */}
      {menu && (
        <Section title="Today's Cafeteria">
          <View style={styles.card}>
            <MenuItem icon="sunny-outline" label="Breakfast" value={menu.breakfast} />
            <MenuItem icon="restaurant-outline" label="Lunch" value={menu.lunch} />
            <MenuItem icon="cafe-outline" label="Snacks" value={menu.snacks} />
          </View>
        </Section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <Section title="Latest Announcements">
          {announcements.map((a, i) => (
            <View key={a._id || i} style={[styles.card, { marginBottom: 10 }]}>
              <View style={styles.annDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.annTitle}>{a.title}</Text>
                <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
                <Text style={styles.annDate}>{new Date(a.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MenuItem({ icon, label, value }) {
  const items = String(value || '').split(',').map(i => i.trim()).filter(Boolean);
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
      <Ionicons name={icon} size={15} color={theme.emerald} style={{ marginRight: 10, width: 20, marginTop: 2 }} />
      <Text style={{ color: theme.textSub, fontSize: 12, width: 72, marginTop: 1 }}>{label}</Text>
      <View style={{ flex: 1 }}>
        {items.length > 1 ? items.map((item, idx) => (
          <Text key={idx} style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>• {item}</Text>
        )) : (
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{value || '—'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  greeting: { color: theme.textSub, fontSize: 13 },
  name: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: theme.errorBg, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5' },
  studentCard: {
    margin: 16, padding: 16, backgroundColor: theme.surface,
    borderRadius: theme.radiusLg, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.emerald, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  studentName: { color: theme.text, fontWeight: '700', fontSize: 15 },
  studentSub: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  feesBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  feesBadgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  card: {
    backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14,
    borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  annDot: { width: 3, height: '100%', minHeight: 40, backgroundColor: theme.emerald, borderRadius: 2, marginRight: 12 },
  annTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 3 },
  annBody: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
  annDate: { color: theme.textMuted, fontSize: 11, marginTop: 5 },
});
