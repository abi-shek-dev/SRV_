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
import theme from '../../config/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function HomeworkScreen() {
  const { authHeaders } = useAuth();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);

  const fetchHomework = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/parent/homework/weekly`, { headers: authHeaders() });
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
    return <LoadingOverlay visible={true} message="Loading homework..." />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <Text style={styles.subtitle}>{homeworkList.length} assignment{homeworkList.length !== 1 ? 's' : ''}</Text>
      </View>

      {homeworkList.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={theme.border} />
          <Text style={styles.emptyText}>No homework assigned yet</Text>
        </View>
      ) : (
        homeworkList.map((hw) => {
          const isPast = hw.dueDate && new Date(hw.dueDate) < new Date();
          const hasSubmission = hw.submission;
          return (
            <View key={hw._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectPill}>
                  <Text style={styles.subjectText}>{hw.subject}</Text>
                </View>
                <View style={[styles.statusBadge,
                  { backgroundColor: isPast ? theme.bg : theme.emeraldBg,
                    borderColor: isPast ? theme.border : theme.emeraldBorder }]}>
                  <Text style={[styles.statusText, { color: isPast ? theme.textMuted : theme.emerald }]}>
                    {isPast ? 'Past due' : 'Active'}
                  </Text>
                </View>
              </View>
              <Text style={styles.hwTitle}>{hw.title}</Text>
              {hw.description ? <Text style={styles.hwDesc}>{hw.description}</Text> : null}
              {hw.dueDate && (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                  <Text style={styles.metaText}>Due: {new Date(hw.dueDate).toLocaleDateString()}</Text>
                </View>
              )}
              {hw.fileUrl && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(hw.fileUrl)}>
                  <Ionicons name="download-outline" size={14} color={theme.emerald} />
                  <Text style={styles.linkText}>Download File</Text>
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
                    : <><Ionicons name="cloud-upload-outline" size={14} color="#fff" /><Text style={styles.submitBtnText}>Submit PDF</Text></>
                  }
                </TouchableOpacity>
              )}
              {hasSubmission && (
                <View style={styles.submittedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.emerald} />
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
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: theme.textMuted, fontSize: 14 },
  card: {
    margin: 16, marginTop: 0, backgroundColor: theme.surface,
    borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectPill: { backgroundColor: theme.emeraldBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.emeraldBorder },
  subjectText: { color: theme.emerald, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  hwTitle: { color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hwDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { color: theme.textMuted, fontSize: 12 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    padding: 10, backgroundColor: theme.emeraldBg, borderRadius: 10, borderWidth: 1, borderColor: theme.emeraldBorder,
  },
  linkText: { color: theme.emerald, fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.emerald, borderRadius: 12, paddingVertical: 10, marginTop: 10,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: theme.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: theme.emeraldBorder,
  },
  submittedText: { color: theme.emerald, fontSize: 12, fontWeight: '700' },
});
