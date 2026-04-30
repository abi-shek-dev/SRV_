import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export default function HomeworkScreen() {
  const { authHeaders } = useAuth();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null); // homework id being uploaded

  const fetchHomework = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/parent/homework`, { headers: authHeaders() });
      setHomeworkList(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchHomework(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchHomework(); };

  const handleSubmitPDF = async (hw) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;
      const file = result.assets[0];

      setUploading(hw._id);

      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' });
      formData.append('homeworkId', hw._id);

      await axios.post(`${API_URL}/api/parent/homework/submit`, formData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Submitted!', 'Your PDF has been submitted successfully.');
      fetchHomework();
    } catch (err) {
      Alert.alert('Upload failed', err.response?.data?.message || 'Could not upload PDF.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <Text style={styles.subtitle}>{homeworkList.length} assignment{homeworkList.length !== 1 ? 's' : ''}</Text>
      </View>

      {homeworkList.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color="#334155" />
          <Text style={styles.emptyText}>No homework assigned yet</Text>
        </View>
      ) : (
        homeworkList.map((hw) => {
          const isPast = hw.deadline && new Date(hw.deadline) < new Date();
          const hasSubmission = hw.submission;
          return (
            <View key={hw._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.subject}>{hw.subject}</Text>
                <View style={[styles.badge,
                  isPast ? styles.badgePast : styles.badgeActive
                ]}>
                  <Text style={styles.badgeText}>{isPast ? 'Past due' : 'Active'}</Text>
                </View>
              </View>
              <Text style={styles.hwTitle}>{hw.title}</Text>
              {hw.description ? <Text style={styles.hwDesc}>{hw.description}</Text> : null}
              {hw.deadline && (
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.meta}>Due: {new Date(hw.deadline).toLocaleDateString()}</Text>
                </View>
              )}
              {hw.fileUrl && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(hw.fileUrl)}>
                  <Ionicons name="download-outline" size={14} color="#6366f1" />
                  <Text style={styles.linkText}>Download Homework File</Text>
                </TouchableOpacity>
              )}
              {hw.allowPdfSubmission && !hasSubmission && !isPast && (
                <TouchableOpacity
                  style={[styles.submitBtn, uploading === hw._id && { opacity: 0.6 }]}
                  onPress={() => handleSubmitPDF(hw)}
                  disabled={uploading === hw._id}
                >
                  {uploading === hw._id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit PDF</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
              {hasSubmission && (
                <View style={styles.submittedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                  <Text style={styles.submittedText}>Submitted</Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#475569', fontSize: 14 },
  card: {
    margin: 16, marginTop: 0, backgroundColor: '#1e293b',
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { color: '#6366f1', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeActive: { backgroundColor: '#1d4ed8' },
  badgePast: { backgroundColor: '#374151' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hwTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hwDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    padding: 10, backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
  },
  linkText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 10, marginTop: 10,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: '#14532d', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
  },
  submittedText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
});
