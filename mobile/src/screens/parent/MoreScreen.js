import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

export default function MoreScreen() {
  const { user, logout, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('fees');
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Feedback form
  const [fbForm, setFbForm] = useState({ category: 'ISSUE', subject: '', message: '' });
  const [fbSubmitting, setFbSubmitting] = useState(false);

  // Leave request
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Timetable
  const [timetable, setTimetable] = useState([]);
  const [ttDay, setTtDay] = useState('');

  // Circulars & Transport
  const [circulars, setCirculars] = useState([]);
  const [transportInfo, setTransportInfo] = useState(null);

  // Library & Teacher Contact
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [teacherContact, setTeacherContact] = useState(null);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);

  // Report Card / Marks
  const [reportCard, setReportCard] = useState(null);

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/parent/student`, { headers: h }).then(r => setStudent(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/parent/events`, { headers: h }).then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/polls`, { headers: h }).then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/memories`, { headers: h }).then(r => setMemories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/feedback`, { headers: h }).then(r => setFeedbacks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/leave`, { headers: h }).then(r => setLeaves(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    // Load timetable if student data available
    axios.get(`${API_URL}/api/parent/student`, { headers: h }).then(studentRes => {
      if (studentRes.data?.grade && studentRes.data?.section) {
        axios.get(`${API_URL}/api/timetable/${studentRes.data.grade}/${studentRes.data.section}`, { headers: h })
          .then(r => {
            setTimetable(r.data.periods || []);
            const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
            setTtDay(days[new Date().getDay()]);
          }).catch(() => {});
      }
    }).catch(() => {});
    // Load circulars + transport
    axios.get(`${API_URL}/api/parent/circulars`, { headers: h }).then(r => setCirculars(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/transport`, { headers: h }).then(r => setTransportInfo(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/parent/library`, { headers: h }).then(r => setLibraryBooks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/teacher-contact`, { headers: h }).then(r => setTeacherContact(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/parent/announcements`, { headers: h }).then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/parent/report-card`, { headers: h }).then(r => setReportCard(r.data)).catch(() => {});
  }, []);

  const submitVote = async (pollId, optionIdx) => {
    try {
      await axios.post(`${API_URL}/api/parent/polls/${pollId}/vote`, { optionIndex: optionIdx }, { headers: authHeaders() });
      const r = await axios.get(`${API_URL}/api/parent/polls`, { headers: authHeaders() });
      setPolls(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Vote failed', err.response?.data?.message || 'Could not submit vote.');
    }
  };

  const submitFeedback = async () => {
    if (!fbForm.subject.trim() || !fbForm.message.trim()) return Alert.alert('Missing fields', 'Subject and message are required.');
    try {
      setFbSubmitting(true);
      await axios.post(`${API_URL}/api/parent/feedback`, fbForm, { headers: authHeaders() });
      Alert.alert('Sent!', 'Feedback submitted successfully.');
      setFbForm({ category: 'ISSUE', subject: '', message: '' });
      const r = await axios.get(`${API_URL}/api/parent/feedback`, { headers: authHeaders() });
      setFeedbacks(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Unable to submit feedback.');
    } finally { setFbSubmitting(false); }
  };

  const submitLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) return Alert.alert('Missing dates', 'Start and end dates are required.');
    try {
      setLeaveSubmitting(true);
      await axios.post(`${API_URL}/api/parent/leave`, leaveForm, { headers: authHeaders() });
      Alert.alert('Submitted!', 'Leave request sent to the school.');
      setLeaveForm({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
      const r = await axios.get(`${API_URL}/api/parent/leave`, { headers: authHeaders() });
      setLeaves(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Unable to submit leave request.');
    } finally { setLeaveSubmitting(false); }
  };

  const TABS = [
    { id: 'fees', label: 'Fees', icon: 'wallet-outline' },
    { id: 'announcements', label: 'Notices', icon: 'megaphone-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'polls', label: 'Polls', icon: 'bar-chart-outline' },
    { id: 'memories', label: 'Memories', icon: 'images-outline' },
    { id: 'feedback', label: 'Feedback', icon: 'chatbubble-outline' },
    { id: 'leave', label: 'Leave', icon: 'calendar-outline' },
    { id: 'timetable', label: 'Schedule', icon: 'time-outline' },
    { id: 'circulars', label: 'Circulars', icon: 'document-text-outline' },
    { id: 'transport', label: 'Bus', icon: 'bus-outline' },
    { id: 'library', label: 'Library', icon: 'library-outline' },
    { id: 'marks', label: 'Marks', icon: 'ribbon-outline' },
    { id: 'contact', label: 'Teacher', icon: 'chatbubbles-outline' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Ionicons name={t.icon} size={13} color={activeTab === t.id ? '#fff' : theme.textSub} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* FEES */}
        {activeTab === 'fees' && student && (
          <View style={{ gap: 10 }}>
            <FeeTerm label="Term 1" status={student.fees?.term1} amount={student.fees?.term1Amount} paid={student.fees?.term1Paid} />
            <FeeTerm label="Term 2" status={student.fees?.term2} amount={student.fees?.term2Amount} paid={student.fees?.term2Paid} />
            <FeeTerm label="Term 3" status={student.fees?.term3} amount={student.fees?.term3Amount} paid={student.fees?.term3Paid} />
            {student.fees?.additionalFees > 0 && (
              <FeeTerm label="Additional" status={student.fees?.additionalFees <= student.fees?.additionalPaid ? 'Paid' : 'Unpaid'} amount={student.fees?.additionalFees} paid={student.fees?.additionalPaid} />
            )}
            <View style={[styles.overallBadge,
              { backgroundColor: student.fees?.overall === 'Paid' ? theme.emeraldBg : theme.errorBg,
                borderColor: student.fees?.overall === 'Paid' ? theme.emeraldBorder : '#fca5a5' }
            ]}>
              <Text style={[styles.overallText, { color: student.fees?.overall === 'Paid' ? theme.emerald : theme.error }]}>
                Overall: {student.fees?.overall || 'Unpaid'}
              </Text>
            </View>
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0 ? <EmptyState icon="calendar-outline" text="No upcoming events" /> :
          events.map((e, i) => (
            <View key={e._id || i} style={styles.card}>
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDay}>{new Date(e.date).getDate()}</Text>
                <Text style={styles.eventMonth}>{new Date(e.date).toLocaleString('default', { month: 'short' })}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
              </View>
            </View>
          ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0 ? <EmptyState icon="bar-chart-outline" text="No active polls" /> :
          polls.map((p, i) => (
            <View key={p._id || i} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.cardTitle}>{p.question}</Text>
              {(p.options || []).map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pollOption, p.userVote === idx && styles.pollOptionVoted]}
                  onPress={() => !p.userVote && submitVote(p._id, idx)}
                >
                  <Text style={[styles.pollOptionText, p.userVote === idx && { color: '#fff' }]}>{opt.text || opt}</Text>
                  {p.userVote === idx && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {/* MEMORIES */}
        {activeTab === 'memories' && (
          memories.length === 0 ? <EmptyState icon="images-outline" text="No memories yet" /> :
          memories.map((m, i) => (
            <View key={m._id || i} style={[styles.memCard, { marginBottom: 12 }]}>
              {m.resourceType === 'image' && (
                <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />
              )}
              <View style={{ padding: 12 }}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
                <TouchableOpacity style={styles.dlBtn} onPress={() => Linking.openURL(m.secureUrl.replace('/upload/', '/upload/fl_attachment/'))}>
                  <Ionicons name="download-outline" size={13} color={theme.emerald} />
                  <Text style={styles.dlText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* FEEDBACK */}
        {activeTab === 'feedback' && (
          <View style={{ gap: 12 }}>
            {/* Submit Form */}
            <View style={styles.fbFormCard}>
              <Text style={styles.fbFormTitle}>Send Feedback</Text>
              <Text style={styles.fbFieldLabel}>Category</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {['ISSUE', 'SUGGESTION', 'CONCERN'].map(c => (
                  <TouchableOpacity key={c} style={[styles.fbChip, fbForm.category === c && styles.fbChipActive]} onPress={() => setFbForm(f => ({ ...f, category: c }))}>
                    <Text style={[styles.fbChipText, fbForm.category === c && styles.fbChipTextActive]}>{c.charAt(0) + c.slice(1).toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fbFieldLabel}>Subject</Text>
              <TextInput style={styles.fbInput} value={fbForm.subject} onChangeText={v => setFbForm(f => ({ ...f, subject: v }))} placeholder="Transport, fees, classroom..." placeholderTextColor={theme.textMuted} />
              <Text style={styles.fbFieldLabel}>Message</Text>
              <TextInput style={[styles.fbInput, { height: 80, textAlignVertical: 'top' }]} value={fbForm.message} onChangeText={v => setFbForm(f => ({ ...f, message: v }))} placeholder="Share details so the school can review..." placeholderTextColor={theme.textMuted} multiline />
              <TouchableOpacity style={[styles.fbSubmitBtn, fbSubmitting && { opacity: 0.6 }]} onPress={submitFeedback} disabled={fbSubmitting}>
                {fbSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.fbSubmitBtnText}>Submit Feedback</Text>}
              </TouchableOpacity>
            </View>

            {/* History */}
            <Text style={styles.fbFormTitle}>Your Feedback History</Text>
            {feedbacks.length === 0 ? <EmptyState icon="chatbubble-outline" text="No feedback submitted yet" /> :
              feedbacks.map((fb, i) => {
                const statusColor = fb.status === 'RESOLVED' ? theme.emerald : fb.status === 'IN_REVIEW' ? theme.amber : theme.error;
                const statusBg = fb.status === 'RESOLVED' ? theme.emeraldBg : fb.status === 'IN_REVIEW' ? theme.amberBg : theme.errorBg;
                return (
                  <View key={fb._id || i} style={styles.card}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <View style={[styles.fbChip, { backgroundColor: statusBg }]}><Text style={[styles.fbChipText, { color: statusColor }]}>{fb.status}</Text></View>
                        <View style={[styles.fbChip, { backgroundColor: theme.bg }]}><Text style={styles.fbChipText}>{fb.category}</Text></View>
                      </View>
                      <Text style={styles.cardTitle}>{fb.subject || 'Feedback'}</Text>
                      <Text style={styles.cardDesc}>{fb.message}</Text>
                      {fb.staffNote ? (
                        <View style={{ backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: theme.emeraldBorder }}>
                          <Text style={{ color: theme.emerald, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>School Note</Text>
                          <Text style={{ color: theme.emeraldDark || theme.emerald, fontSize: 12 }}>{fb.staffNote}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.cardDate}>{new Date(fb.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                );
              })
            }
          </View>
        )}
      </ScrollView>

        {/* LEAVE REQUESTS */}
        {activeTab === 'leave' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={styles.fbFormCard}>
              <Text style={styles.fbFormTitle}>Request Leave</Text>
              <Text style={styles.fbFieldLabel}>Leave Type</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {['SICK', 'PERSONAL', 'FAMILY', 'OTHER'].map(t => (
                  <TouchableOpacity key={t} style={[styles.fbChip, leaveForm.leaveType === t && styles.fbChipActive]} onPress={() => setLeaveForm(f => ({ ...f, leaveType: t }))}>
                    <Text style={[styles.fbChipText, leaveForm.leaveType === t && styles.fbChipTextActive]}>{t.charAt(0) + t.slice(1).toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fbFieldLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.fbInput} value={leaveForm.startDate} onChangeText={v => setLeaveForm(f => ({ ...f, startDate: v }))} placeholder="2026-05-05" placeholderTextColor={theme.textMuted} />
              <Text style={styles.fbFieldLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.fbInput} value={leaveForm.endDate} onChangeText={v => setLeaveForm(f => ({ ...f, endDate: v }))} placeholder="2026-05-07" placeholderTextColor={theme.textMuted} />
              <Text style={styles.fbFieldLabel}>Reason</Text>
              <TextInput style={[styles.fbInput, { height: 70, textAlignVertical: 'top' }]} value={leaveForm.reason} onChangeText={v => setLeaveForm(f => ({ ...f, reason: v }))} placeholder="Brief reason for leave..." placeholderTextColor={theme.textMuted} multiline />
              <TouchableOpacity style={[styles.fbSubmitBtn, leaveSubmitting && { opacity: 0.6 }]} onPress={submitLeave} disabled={leaveSubmitting}>
                {leaveSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.fbSubmitBtnText}>Submit Leave Request</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.fbFormTitle}>Leave History</Text>
            {leaves.length === 0 ? <View style={styles.card}><Text style={styles.cardDesc}>No leave requests yet.</Text></View> :
              leaves.map((lv, i) => {
                const statusColor = lv.status === 'APPROVED' ? theme.emerald : lv.status === 'REJECTED' ? theme.error : theme.amber;
                const statusBg = lv.status === 'APPROVED' ? theme.emeraldBg : lv.status === 'REJECTED' ? theme.errorBg : theme.amberBg;
                return (
                  <View key={lv._id || i} style={styles.card}>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                      <View style={[styles.fbChip, { backgroundColor: statusBg }]}><Text style={[styles.fbChipText, { color: statusColor }]}>{lv.status}</Text></View>
                      <View style={[styles.fbChip, { backgroundColor: theme.bg }]}><Text style={styles.fbChipText}>{lv.leaveType}</Text></View>
                    </View>
                    <Text style={styles.cardTitle}>{new Date(lv.startDate).toLocaleDateString()} → {new Date(lv.endDate).toLocaleDateString()}</Text>
                    {lv.reason ? <Text style={styles.cardDesc}>{lv.reason}</Text> : null}
                    {lv.reviewNote ? (
                      <View style={{ backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: theme.emeraldBorder }}>
                        <Text style={{ color: theme.emerald, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>School Note</Text>
                        <Text style={{ color: theme.emeraldDark || theme.emerald, fontSize: 12 }}>{lv.reviewNote}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            }
          </ScrollView>
        )}

        {/* TIMETABLE */}
        {activeTab === 'timetable' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Class Schedule</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['MON','TUE','WED','THU','FRI','SAT'].map(d => (
                  <TouchableOpacity key={d} onPress={() => setTtDay(d)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: ttDay === d ? theme.primary : theme.bg }}>
                    <Text style={{ color: ttDay === d ? '#fff' : theme.textSub, fontSize: 12, fontWeight: '700' }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {timetable.filter(p => p.dayOfWeek === ttDay).length === 0 ? (
              <View style={styles.card}><Text style={styles.cardDesc}>No classes scheduled for {ttDay}.</Text></View>
            ) : timetable.filter(p => p.dayOfWeek === ttDay).sort((a, b) => a.periodNumber - b.periodNumber).map((p, i) => (
              <View key={i} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.primaryBg || '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '800' }}>P{p.periodNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.subject || 'Free'}</Text>
                  {p.teacherName ? <Text style={styles.cardDesc}>{p.teacherName}</Text> : null}
                  {p.startTime || p.endTime ? <Text style={{ color: theme.textMuted, fontSize: 11 }}>{p.startTime} – {p.endTime}</Text> : null}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* CIRCULARS */}
        {activeTab === 'circulars' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>School Circulars</Text>
            {circulars.length === 0 ? (
              <View style={styles.card}><Text style={styles.cardDesc}>No circulars at this time.</Text></View>
            ) : circulars.map((c, i) => (
              <View key={c._id || i} style={styles.card}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardDesc}>{c.description}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Text style={{ color: theme.emerald, fontSize: 10, fontWeight: '700', backgroundColor: theme.emeraldBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>{c.targetType === 'CLASS' ? `${c.targetGrade}-${c.targetSection}` : 'Global'}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                </View>
                {c.fileUrl ? <TouchableOpacity onPress={() => {}}><Text style={{ color: theme.primary, fontSize: 11, marginTop: 4 }}>📎 View Attachment</Text></TouchableOpacity> : null}
              </View>
            ))}
          </ScrollView>
        )}

        {/* TRANSPORT */}
        {activeTab === 'transport' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Bus Information</Text>
            {!transportInfo ? (
              <View style={styles.card}><Text style={styles.cardDesc}>No transport assigned for your child.</Text></View>
            ) : (
              <View style={[styles.card, { gap: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>🚌</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{transportInfo.routeName}</Text>
                    <Text style={styles.cardDesc}>Bus: {transportInfo.busNumber || 'N/A'}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: theme.bg, borderRadius: 12, padding: 12, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>Driver: {transportInfo.driverName || 'N/A'}</Text>
                  <Text style={{ color: theme.textSub, fontSize: 11 }}>📞 {transportInfo.driverPhone || 'N/A'}</Text>
                  {transportInfo.helperName ? <Text style={{ color: theme.textSub, fontSize: 11 }}>Helper: {transportInfo.helperName} ({transportInfo.helperPhone || '-'})</Text> : null}
                </View>
                {transportInfo.stopName && (
                  <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
                    <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700' }}>Your Stop: {transportInfo.stopName}</Text>
                    <Text style={{ color: '#059669', fontSize: 11 }}>Pickup: {transportInfo.pickupTime || '-'} • Drop: {transportInfo.dropTime || '-'}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* LIBRARY */}
        {activeTab === 'library' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>My Library Books</Text>
            {libraryBooks.length === 0 ? <EmptyState icon="library-outline" text="No books issued yet." /> : libraryBooks.map(b => (
              <View key={b._id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{b.bookTitle}</Text>
                  <Text style={styles.cardDesc}>Author: {b.bookAuthor || '-'}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Issued: {new Date(b.issuedDate).toLocaleDateString()}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Due: {new Date(b.dueDate).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={{ justifyContent: 'center' }}>
                  {b.status === 'ISSUED' && <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>ISSUED</Text>}
                  {b.status === 'OVERDUE' && <Text style={{ color: theme.error, fontSize: 12, fontWeight: '700' }}>OVERDUE</Text>}
                  {b.status === 'RETURNED' && <Text style={{ color: theme.emerald, fontSize: 12, fontWeight: '700' }}>RETURNED</Text>}
                  {b.fineAmount > 0 && <Text style={{ color: theme.error, fontSize: 10, marginTop: 4 }}>Fine: ₹{b.fineAmount}</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TEACHER CONTACT / WHATSAPP */}
        {activeTab === 'contact' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Class Teacher Contact</Text>
            {!teacherContact ? <EmptyState icon="person-outline" text="No teacher assigned yet." /> : (
              <View style={[styles.card, { flexDirection: 'column', padding: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: theme.primary, fontSize: 20, fontWeight: '800' }}>{teacherContact.teacherName?.[0]}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>{teacherContact.teacherName}</Text>
                    <Text style={{ color: theme.textSub, fontSize: 13 }}>Class Teacher ({teacherContact.grade}-{teacherContact.section})</Text>
                  </View>
                </View>

                {teacherContact.contactNumber ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, backgroundColor: theme.bg, padding: 12, borderRadius: 12 }}>
                    <Ionicons name="call" size={20} color={theme.textSub} />
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{teacherContact.contactNumber}</Text>
                  </View>
                ) : (
                  <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 12 }}>Phone number not provided.</Text>
                )}

                {teacherContact.whatsappLink ? (
                  <TouchableOpacity onPress={() => Linking.openURL(teacherContact.whatsappLink).catch(() => Alert.alert('Error', 'Invalid WhatsApp link'))} style={{ backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Join Class WhatsApp Group</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: theme.bg, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ color: theme.textSub, fontSize: 13 }}>WhatsApp link not provided.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>School Notices</Text>
            {announcements.length === 0 ? <EmptyState icon="megaphone-outline" text="No announcements yet." /> :
              announcements.map((ann, i) => {
                const priorityColor = ann.priority === 'HIGH' ? '#ef4444' : ann.priority === 'MEDIUM' ? theme.amber : theme.textSub;
                const priorityBg = ann.priority === 'HIGH' ? '#fef2f2' : ann.priority === 'MEDIUM' ? theme.amberBg : theme.bg;
                return (
                  <View key={ann._id || i} style={[styles.card, { flexDirection: 'column', borderLeftWidth: 4, borderLeftColor: priorityColor, paddingLeft: 14 }]}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: priorityBg }}>
                        <Text style={{ color: priorityColor, fontSize: 10, fontWeight: '700' }}>{ann.priority}</Text>
                      </View>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>{new Date(ann.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{ann.title}</Text>
                    <Text style={styles.cardDesc}>{ann.message}</Text>
                  </View>
                );
              })
            }
          </ScrollView>
        )}

        {/* MARKS / REPORT CARD */}
        {activeTab === 'marks' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Marks & Report Card</Text>
            {!reportCard || !reportCard.terms || reportCard.terms.length === 0 ? (
              <EmptyState icon="ribbon-outline" text="No marks uploaded yet." />
            ) : (
              reportCard.terms.map((term, ti) => (
                <View key={ti} style={[styles.card, { flexDirection: 'column', gap: 8 }]}>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>{term.termName}</Text>
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
              ))
            )}
          </ScrollView>
        )}

    </View>
  );
}

function FeeTerm({ label, status, amount, paid }) {
  const isPaid = status === 'Paid';
  const isPartial = status === 'Partial';
  const color = isPaid ? theme.emerald : isPartial ? theme.amber : theme.error;
  const bg = isPaid ? theme.emeraldBg : isPartial ? theme.amberBg : theme.errorBg;
  const border = isPaid ? theme.emeraldBorder : isPartial ? theme.amberBorder : '#fca5a5';
  return (
    <View style={styles.feeCard}>
      <Text style={styles.feeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.feeAmount}>₹{Number(paid || 0).toLocaleString()} <Text style={styles.feeTotal}>/ ₹{Number(amount || 0).toLocaleString()}</Text></Text>
      </View>
      <View style={[styles.feeBadge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.feeBadgeText, { color }]}>{status || 'Unpaid'}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon, text }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, gap: 12 }}>
      <Ionicons name={icon} size={40} color={theme.border} />
      <Text style={{ color: theme.textMuted, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  logoutBtn: { padding: 8, backgroundColor: theme.errorBg, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5' },
  tabBar: { flexGrow: 0, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  tabActive: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  tabText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 8 },
  cardTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
  cardDate: { color: theme.textMuted, fontSize: 11, marginTop: 6 },
  eventDateBadge: { backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 44, borderWidth: 1, borderColor: theme.emeraldBorder },
  eventDay: { color: theme.emerald, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  eventMonth: { color: theme.emerald, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pollOption: { backgroundColor: theme.bg, borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  pollOptionVoted: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  pollOptionText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  memCard: { backgroundColor: theme.surface, borderRadius: theme.radius, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memImage: { width: '100%', height: 180 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  dlText: { color: theme.emerald, fontSize: 13, fontWeight: '600' },
  feeCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  feeLabel: { color: theme.textSub, fontSize: 13, fontWeight: '600', width: 72 },
  feeAmount: { color: theme.text, fontSize: 13, fontWeight: '700' },
  feeTotal: { color: theme.textMuted, fontWeight: '400' },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  feeBadgeText: { fontSize: 11, fontWeight: '700' },
  overallBadge: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  overallText: { fontWeight: '800', fontSize: 15 },
  fbFormCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  fbFormTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  fbFieldLabel: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 4 },
  fbInput: { backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 14, marginBottom: 4 },
  fbChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
  fbChipActive: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  fbChipText: { color: theme.textSub, fontSize: 11, fontWeight: '600' },
  fbChipTextActive: { color: '#fff' },
  fbSubmitBtn: { backgroundColor: theme.emerald, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  fbSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
