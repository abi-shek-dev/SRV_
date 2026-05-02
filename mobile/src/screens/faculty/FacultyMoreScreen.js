import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import theme from '../../config/theme';

export default function FacultyMoreScreen() {
  const { logout, authHeaders, user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('behavior');
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Behavior form
  const [behaviorStudent, setBehaviorStudent] = useState('');
  const [behaviorScore, setBehaviorScore] = useState('');
  const [behaviorRemarks, setBehaviorRemarks] = useState('');

  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', body: '' });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [submitForm, setSubmitForm] = useState({ proofUrl: '', proofType: 'link', comments: '' });

  // Feedback state
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});

  // Leave requests
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveReviewNote, setLeaveReviewNote] = useState('');

  // Timetable
  const [timetable, setTimetable] = useState([]);
  const [ttDay, setTtDay] = useState('');

  // Profile settings
  const [waInfo, setWaInfo] = useState({ whatsappLink: '', contactNumber: '' });

  // Circulars
  const [circulars, setCirculars] = useState([]);

  // Transport
  const [myTransport, setMyTransport] = useState(null);
  const [classRoster, setClassRoster] = useState([]);
  const [transportSubTab, setTransportSubTab] = useState('mybus');

  // My Leaves
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLeaveForm, setMyLeaveForm] = useState({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
  const [myLeaveSubmitting, setMyLeaveSubmitting] = useState(false);

  // Library
  const [libBooks, setLibBooks] = useState([]);
  const [libIssues, setLibIssues] = useState([]);
  const [libSubTab, setLibSubTab] = useState('books');

  useEffect(() => {
    const h = authHeaders();
    axios.get(`${API_URL}/api/faculty/students`, { headers: h }).then(r => setStudents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/events`, { headers: h }).then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/polls`, { headers: h }).then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/memories`, { headers: h }).then(r => setMemories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/announcements`, { headers: h }).then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/tasks`, { headers: h }).then(r => setTasks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/performance/me`, { headers: h }).then(r => setPerformance(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/faculty/feedback`, { headers: h }).then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setFeedbackList(list);
      setFeedbackDrafts(list.reduce((a, fb) => ({ ...a, [fb._id]: { status: fb.status, staffNote: fb.staffNote || '' } }), {}));
    }).catch(() => {});
    axios.get(`${API_URL}/api/faculty/leave-requests`, { headers: h }).then(r => setLeaveRequests(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/whatsapp-info`, { headers: h }).then(r => setWaInfo(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/faculty/circulars`, { headers: h }).then(r => setCirculars(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/my-transport`, { headers: h }).then(r => setMyTransport(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/faculty/transport`, { headers: h }).then(r => setClassRoster(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/my-leaves`, { headers: h }).then(r => setMyLeaves(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/library/books`, { headers: h }).then(r => setLibBooks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${API_URL}/api/faculty/library/issues`, { headers: h }).then(r => setLibIssues(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    // Load timetable for faculty's assigned class
    if (user?.assignedGrade && user?.assignedSection) {
      axios.get(`${API_URL}/api/timetable/${user.assignedGrade}/${user.assignedSection}`, { headers: h })
        .then(r => {
          setTimetable(r.data.periods || []);
          const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
          setTtDay(days[new Date().getDay()]);
        }).catch(() => {});
    }
  }, []);

  const submitBehavior = async () => {
    if (!behaviorStudent || !behaviorScore) return Alert.alert('Missing fields', 'Select a student and enter a score.');
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/behavior`, {
        date: new Date().toISOString().split('T')[0],
        records: [{ studentId: behaviorStudent, score: Number(behaviorScore), remarks: behaviorRemarks }]
      }, { headers: authHeaders() });
      Alert.alert('Saved!', 'Behavior log saved.');
      setBehaviorStudent(''); setBehaviorScore(''); setBehaviorRemarks('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save.');
    } finally { setSubmitting(false); }
  };

  const submitTaskProof = async (taskId) => {
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/tasks/${taskId}/submit`, submitForm, { headers: authHeaders() });
      Alert.alert('Success', 'Proof submitted!');
      setSubmittingTaskId(null);
      setSubmitForm({ proofUrl: '', proofType: 'link', comments: '' });
      const r = await axios.get(`${API_URL}/api/tasks`, { headers: authHeaders() });
      setTasks(Array.isArray(r.data) ? r.data : []);
      const p = await axios.get(`${API_URL}/api/performance/me`, { headers: authHeaders() });
      setPerformance(p.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit.');
    } finally { setSubmitting(false); }
  };

  const getMySubmission = (task) => {
    const userId = user?._id || user?.id;
    return task.submissions?.find(s => (s.facultyId?._id || s.facultyId) === userId);
  };

  const saveFeedback = async (fbId) => {
    try {
      setSubmitting(true);
      await axios.put(`${API_URL}/api/faculty/feedback/${fbId}`, feedbackDrafts[fbId], { headers: authHeaders() });
      Alert.alert('Saved', 'Feedback status updated.');
      const r = await axios.get(`${API_URL}/api/faculty/feedback`, { headers: authHeaders() });
      const list = Array.isArray(r.data) ? r.data : [];
      setFeedbackList(list);
      setFeedbackDrafts(list.reduce((a, fb) => ({ ...a, [fb._id]: { status: fb.status, staffNote: fb.staffNote || '' } }), {}));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update.');
    } finally { setSubmitting(false); }
  };

  const submitAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.body.trim()) return Alert.alert('Missing fields', 'Title and body are required.');
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/announcements`, annForm, { headers: authHeaders() });
      setAnnForm({ title: '', body: '' }); setShowAnnForm(false);
      const r = await axios.get(`${API_URL}/api/faculty/announcements`, { headers: authHeaders() });
      setAnnouncements(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post.');
    } finally { setSubmitting(false); }
  };

  const updateWaInfo = async () => {
    setSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/faculty/whatsapp-info`, waInfo, { headers: authHeaders() });
      Alert.alert('Success', 'Contact settings updated!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    } finally { setSubmitting(false); }
  };

  const submitMyLeave = async () => {
    if (!myLeaveForm.startDate || !myLeaveForm.endDate) return Alert.alert('Missing dates', 'Start and end dates are required.');
    try {
      setMyLeaveSubmitting(true);
      await axios.post(`${API_URL}/api/faculty/my-leaves`, myLeaveForm, { headers: authHeaders() });
      Alert.alert('Submitted!', 'Your leave request has been sent.');
      setMyLeaveForm({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
      const r = await axios.get(`${API_URL}/api/faculty/my-leaves`, { headers: authHeaders() });
      setMyLeaves(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Unable to submit leave.');
    } finally { setMyLeaveSubmitting(false); }
  };

  const TABS = [
    { id: 'behavior', label: 'Behavior', icon: 'star-outline' },
    { id: 'mytasks', label: 'Tasks', icon: 'trophy-outline' },
    { id: 'feedback', label: 'Feedback', icon: 'chatbubble-ellipses-outline' },
    { id: 'announcements', label: 'Posts', icon: 'megaphone-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'polls', label: 'Polls', icon: 'bar-chart-outline' },
    { id: 'memories', label: 'Memories', icon: 'images-outline' },
    { id: 'leaves', label: 'Student Leave', icon: 'people-outline' },
    { id: 'myleaves', label: 'My Leave', icon: 'calendar-outline' },
    { id: 'timetable', label: 'Schedule', icon: 'time-outline' },
    { id: 'circulars', label: 'Circulars', icon: 'document-text-outline' },
    { id: 'transport', label: 'Transport', icon: 'bus-outline' },
    { id: 'library', label: 'Library', icon: 'library-outline' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, activeTab === t.id && styles.tabActive]} onPress={() => setActiveTab(t.id)}>
            <Ionicons name={t.icon} size={13} color={activeTab === t.id ? '#fff' : theme.textSub} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* BEHAVIOR */}
        {activeTab === 'behavior' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log Behavior</Text>
            <Text style={styles.fieldLabel}>Select Student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {students.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.chip, behaviorStudent === s._id && styles.chipActive]}
                    onPress={() => setBehaviorStudent(s._id)}
                  >
                    <Text style={[styles.chipText, behaviorStudent === s._id && styles.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.fieldLabel}>Score (1–10)</Text>
            <TextInput style={styles.input} value={behaviorScore} onChangeText={setBehaviorScore} keyboardType="numeric" placeholder="e.g. 8" placeholderTextColor={theme.textMuted} maxLength={2} />
            <Text style={styles.fieldLabel}>Remarks (optional)</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={behaviorRemarks} onChangeText={setBehaviorRemarks} placeholder="Any remarks..." placeholderTextColor={theme.textMuted} multiline />
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitBehavior} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Save Behavior Log</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAnnForm(v => !v)}>
              <Ionicons name={showAnnForm ? 'close' : 'add'} size={16} color="#fff" />
              <Text style={styles.addBtnText}>{showAnnForm ? 'Cancel' : 'New Announcement'}</Text>
            </TouchableOpacity>
            {showAnnForm && (
              <View style={[styles.formCard, { marginTop: 12 }]}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput style={styles.input} value={annForm.title} onChangeText={v => setAnnForm(f => ({ ...f, title: v }))} placeholder="Announcement title" placeholderTextColor={theme.textMuted} />
                <Text style={styles.fieldLabel}>Body</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={annForm.body} onChangeText={v => setAnnForm(f => ({ ...f, body: v }))} placeholder="Write announcement..." placeholderTextColor={theme.textMuted} multiline />
                <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitAnnouncement} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Post Announcement</Text>}
                </TouchableOpacity>
              </View>
            )}
            {announcements.map((a, i) => (
              <View key={a._id || i} style={[styles.card, { marginTop: 10 }]}>
                <View style={styles.annStripe} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardDesc}>{a.body}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          events.length === 0 ? <EmptyState icon="calendar-outline" text="No events" /> :
          events.map((e, i) => (
            <View key={e._id || i} style={[styles.card, { marginBottom: 10 }]}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardSub}>{new Date(e.date).toLocaleDateString()}</Text>
              {e.description ? <Text style={styles.cardDesc}>{e.description}</Text> : null}
            </View>
          ))
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          polls.length === 0 ? <EmptyState icon="bar-chart-outline" text="No polls" /> :
          polls.map((p, i) => (
            <View key={p._id || i} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.cardTitle}>{p.question}</Text>
              {(p.options || []).map((opt, idx) => (
                <View key={idx} style={styles.pollOption}>
                  <Text style={styles.cardDesc}>{opt.text || opt}</Text>
                  <Text style={styles.pollCount}>{opt.votes || 0} votes</Text>
                </View>
              ))}
            </View>
          ))
        )}

        {/* MEMORIES */}
        {activeTab === 'memories' && (
          memories.length === 0 ? <EmptyState icon="images-outline" text="No memories" /> :
          memories.map((m, i) => (
            <View key={m._id || i} style={[styles.memCard, { marginBottom: 12 }]}>
              {m.resourceType === 'image' && <Image source={{ uri: m.secureUrl }} style={styles.memImage} resizeMode="cover" />}
              <View style={{ padding: 12 }}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
              </View>
            </View>
          ))
        )}
        {/* MY TASKS */}
        {activeTab === 'mytasks' && (
          <View style={{ gap: 14 }}>
            {performance && (
              <View style={styles.perfCard}>
                <Text style={styles.perfTitle}>My Performance Score</Text>
                <Text style={styles.perfSub}>Based on tasks, quality, feedback & contributions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <View style={styles.perfPill}><Text style={styles.perfPillNum}>{performance.finalScore}</Text><Text style={styles.perfPillLabel}>Overall</Text></View>
                  <View style={styles.perfPill}><Text style={styles.perfPillNum}>{performance.taskScore}%</Text><Text style={styles.perfPillLabel}>Tasks</Text></View>
                  <View style={styles.perfPill}><Text style={styles.perfPillNum}>{performance.qualityScore}%</Text><Text style={styles.perfPillLabel}>Quality</Text></View>
                  <View style={styles.perfPill}><Text style={styles.perfPillNum}>{performance.feedbackScore}%</Text><Text style={styles.perfPillLabel}>Feedback</Text></View>
                  <View style={styles.perfPill}><Text style={styles.perfPillNum}>{performance.contributionScore}%</Text><Text style={styles.perfPillLabel}>Contrib.</Text></View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <View style={styles.perfBadge}><Text style={styles.perfBadgeText}>✅ {performance.completedTasks}/{performance.totalTasks} done</Text></View>
                  {performance.pendingTasks > 0 && <View style={[styles.perfBadge, { backgroundColor: 'rgba(245,158,11,0.2)' }]}><Text style={[styles.perfBadgeText, { color: '#fbbf24' }]}>⏳ {performance.pendingTasks} pending</Text></View>}
                </View>
              </View>
            )}
            <Text style={[styles.formTitle, { marginTop: 4 }]}>Assigned Tasks ({tasks.length})</Text>
            {tasks.length === 0 ? <EmptyState icon="trophy-outline" text="No tasks assigned yet" /> :
              tasks.map((task, i) => {
                const mySub = getMySubmission(task);
                const isOverdue = new Date(task.deadline) < new Date() && !mySub;
                return (
                  <View key={task._id || i} style={styles.formCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <Text style={styles.cardTitle}>{task.title}</Text>
                      <View style={[styles.chip, { backgroundColor: theme.bg }]}><Text style={styles.chipText}>{task.taskType}</Text></View>
                      {isOverdue && <View style={[styles.chip, { backgroundColor: theme.errorBg }]}><Text style={[styles.chipText, { color: theme.error }]}>Overdue</Text></View>}
                    </View>
                    <Text style={styles.cardDesc}>{task.description}</Text>
                    <Text style={[styles.cardDesc, { fontSize: 11, marginTop: 4, fontWeight: '600' }]}>⏰ Due: {new Date(task.deadline).toLocaleDateString()}</Text>
                    {mySub ? (
                      <View style={{ marginTop: 10, alignItems: 'flex-start', gap: 4 }}>
                        <View style={[styles.chip, { backgroundColor: mySub.status === 'Approved' ? theme.emeraldBg : mySub.status === 'Rejected' ? theme.errorBg : theme.amberBg }]}>
                          <Text style={[styles.chipText, { color: mySub.status === 'Approved' ? theme.emerald : mySub.status === 'Rejected' ? theme.error : theme.amber }]}>{mySub.status}</Text>
                        </View>
                        {mySub.qualityScore > 0 && <Text style={[styles.cardDesc, { fontSize: 11 }]}>Quality: {mySub.qualityScore}/100</Text>}
                        {mySub.adminFeedback ? <Text style={[styles.cardDesc, { fontSize: 11, fontStyle: 'italic' }]}>"{mySub.adminFeedback}"</Text> : null}
                      </View>
                    ) : (
                      <View style={{ marginTop: 10 }}>
                        {submittingTaskId === task._id ? (
                          <View style={{ gap: 8 }}>
                            <Text style={styles.fieldLabel}>Proof URL</Text>
                            <TextInput style={styles.input} value={submitForm.proofUrl} onChangeText={v => setSubmitForm(f => ({ ...f, proofUrl: v }))} placeholder="https://..." placeholderTextColor={theme.textMuted} />
                            <Text style={styles.fieldLabel}>Comments</Text>
                            <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={submitForm.comments} onChangeText={v => setSubmitForm(f => ({ ...f, comments: v }))} placeholder="Any notes..." placeholderTextColor={theme.textMuted} multiline />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity style={[styles.submitBtn, { flex: 1 }, submitting && { opacity: 0.6 }]} onPress={() => submitTaskProof(task._id)} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Submit</Text>}
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: theme.border }]} onPress={() => setSubmittingTaskId(null)}>
                                <Text style={[styles.submitBtnText, { color: theme.text }]}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity style={[styles.submitBtn, { alignSelf: 'flex-start', paddingHorizontal: 16 }]} onPress={() => setSubmittingTaskId(task._id)}>
                            <Text style={styles.submitBtnText}>Submit Proof</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            }
          </View>
        )}

        {/* FEEDBACK INBOX */}
        {activeTab === 'feedback' && (
          <View style={{ gap: 10 }}>
            <Text style={styles.formTitle}>Parent Feedback Inbox</Text>
            {feedbackList.length === 0 ? <EmptyState icon="chatbubble-ellipses-outline" text="No parent feedback yet" /> :
              feedbackList.map((fb, i) => {
                const draft = feedbackDrafts[fb._id] || { status: fb.status, staffNote: '' };
                const statusColor = fb.status === 'RESOLVED' ? theme.emerald : fb.status === 'IN_REVIEW' ? theme.amber : theme.error;
                const statusBg = fb.status === 'RESOLVED' ? theme.emeraldBg : fb.status === 'IN_REVIEW' ? theme.amberBg : theme.errorBg;
                return (
                  <View key={fb._id || i} style={styles.formCard}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <View style={[styles.chip, { backgroundColor: statusBg }]}><Text style={[styles.chipText, { color: statusColor }]}>{fb.status}</Text></View>
                      <View style={[styles.chip, { backgroundColor: theme.bg }]}><Text style={styles.chipText}>{fb.category}</Text></View>
                      <View style={[styles.chip, { backgroundColor: theme.infoBg }]}><Text style={[styles.chipText, { color: theme.info }]}>{fb.grade}-{fb.section}</Text></View>
                    </View>
                    <Text style={styles.cardTitle}>{fb.subject}</Text>
                    <Text style={[styles.cardDesc, { fontSize: 12, marginBottom: 4 }]}>Parent: {fb.parentId?.name || 'Parent'} • Student: {fb.studentName || 'Student'}</Text>
                    <View style={{ backgroundColor: theme.bg, borderRadius: 10, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={styles.cardDesc}>{fb.message}</Text>
                    </View>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                      {['OPEN', 'IN_REVIEW', 'RESOLVED'].map(s => (
                        <TouchableOpacity key={s} style={[styles.chip, draft.status === s && styles.chipActive]} onPress={() => setFeedbackDrafts(d => ({ ...d, [fb._id]: { ...draft, status: s } }))}>
                          <Text style={[styles.chipText, draft.status === s && styles.chipTextActive]}>{s.replace('_', ' ')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.fieldLabel}>Review Note</Text>
                    <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={draft.staffNote} onChangeText={v => setFeedbackDrafts(d => ({ ...d, [fb._id]: { ...draft, staffNote: v } }))} placeholder="Add notes..." placeholderTextColor={theme.textMuted} multiline />
                    <TouchableOpacity style={[styles.submitBtn, { marginTop: 8 }, submitting && { opacity: 0.6 }]} onPress={() => saveFeedback(fb._id)} disabled={submitting}>
                      {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Save</Text>}
                    </TouchableOpacity>
                    <Text style={[styles.cardDesc, { fontSize: 10, marginTop: 6 }]}>Submitted {new Date(fb.createdAt).toLocaleDateString()}</Text>
                  </View>
                );
              })
            }
          </View>
        )}

      </ScrollView>

        {/* LEAVE REQUESTS */}
        {activeTab === 'leaves' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Student Leave Requests</Text>
            {leaveRequests.length === 0 ? <View style={styles.card}><Text style={styles.cardDesc}>No leave requests for your class.</Text></View> :
              leaveRequests.map((lv, i) => {
                const statusColor = lv.status === 'APPROVED' ? theme.emerald : lv.status === 'REJECTED' ? theme.error : theme.amber;
                const statusBg = lv.status === 'APPROVED' ? theme.emeraldBg : lv.status === 'REJECTED' ? theme.errorBg : theme.amberBg;
                return (
                  <View key={lv._id || i} style={styles.card}>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: statusBg }}><Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{lv.status}</Text></View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: theme.bg }}><Text style={{ color: theme.textSub, fontSize: 11, fontWeight: '600' }}>{lv.leaveType}</Text></View>
                    </View>
                    <Text style={styles.cardTitle}>{lv.studentName}</Text>
                    <Text style={styles.cardDesc}>{new Date(lv.startDate).toLocaleDateString()} → {new Date(lv.endDate).toLocaleDateString()}</Text>
                    {lv.reason ? <Text style={{ color: theme.textSub, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{lv.reason}</Text> : null}
                    {lv.status === 'PENDING' && (
                      <View style={{ marginTop: 10, gap: 8 }}>
                        <TextInput style={{ backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 8, color: theme.text, fontSize: 13 }} value={leaveReviewNote} onChangeText={setLeaveReviewNote} placeholder="Optional note..." placeholderTextColor={theme.textMuted} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} onPress={async () => {
                            try {
                              await axios.put(`${API_URL}/api/faculty/leave-requests/${lv._id}`, { status: 'APPROVED', reviewNote: leaveReviewNote }, { headers: authHeaders() });
                              Alert.alert('Approved', 'Leave approved.');
                              setLeaveReviewNote('');
                              setLeaveRequests(prev => prev.map(l => l._id === lv._id ? { ...l, status: 'APPROVED', reviewNote: leaveReviewNote } : l));
                            } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed.'); }
                          }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Approve</Text></TouchableOpacity>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: theme.error, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} onPress={async () => {
                            try {
                              await axios.put(`${API_URL}/api/faculty/leave-requests/${lv._id}`, { status: 'REJECTED', reviewNote: leaveReviewNote }, { headers: authHeaders() });
                              Alert.alert('Rejected', 'Leave rejected.');
                              setLeaveReviewNote('');
                              setLeaveRequests(prev => prev.map(l => l._id === lv._id ? { ...l, status: 'REJECTED', reviewNote: leaveReviewNote } : l));
                            } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed.'); }
                          }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reject</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
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

        {/* PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Contact Settings</Text>
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardDesc}>Parents will see these details in their portal to contact you or join your class group.</Text>
                <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="WhatsApp Group Link (e.g. https://chat.whatsapp.com/...)" value={waInfo.whatsappLink} onChangeText={t => setWaInfo({ ...waInfo, whatsappLink: t })} />
                <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Contact Phone Number" keyboardType="phone-pad" value={waInfo.contactNumber} onChangeText={t => setWaInfo({ ...waInfo, contactNumber: t })} />
                <TouchableOpacity style={[styles.submitBtn, { marginTop: 12 }]} onPress={updateWaInfo} disabled={submitting}>
                  <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Save Settings'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* MY LEAVES */}
        {activeTab === 'myleaves' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Request Personal Leave</Text>
              <Text style={styles.fieldLabel}>Leave Type</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {['SICK', 'PERSONAL', 'FAMILY', 'OTHER'].map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, myLeaveForm.leaveType === t && styles.chipActive]} onPress={() => setMyLeaveForm(f => ({ ...f, leaveType: t }))}>
                    <Text style={[styles.chipText, myLeaveForm.leaveType === t && styles.chipTextActive]}>{t.charAt(0) + t.slice(1).toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={myLeaveForm.startDate} onChangeText={v => setMyLeaveForm(f => ({ ...f, startDate: v }))} placeholder="2026-05-10" placeholderTextColor={theme.textMuted} />
              <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={myLeaveForm.endDate} onChangeText={v => setMyLeaveForm(f => ({ ...f, endDate: v }))} placeholder="2026-05-12" placeholderTextColor={theme.textMuted} />
              <Text style={styles.fieldLabel}>Reason</Text>
              <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={myLeaveForm.reason} onChangeText={v => setMyLeaveForm(f => ({ ...f, reason: v }))} placeholder="Brief reason..." placeholderTextColor={theme.textMuted} multiline />
              <TouchableOpacity style={[styles.submitBtn, myLeaveSubmitting && { opacity: 0.6 }]} onPress={submitMyLeave} disabled={myLeaveSubmitting}>
                {myLeaveSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Submit Leave Request</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.formTitle}>My Leave History</Text>
            {myLeaves.length === 0 ? <EmptyState icon="calendar-outline" text="No leave requests yet." /> :
              myLeaves.map((lv, i) => {
                const sc = lv.status === 'APPROVED' ? theme.emerald : lv.status === 'REJECTED' ? theme.error : theme.amber;
                const sb = lv.status === 'APPROVED' ? theme.emeraldBg : lv.status === 'REJECTED' ? theme.errorBg : theme.amberBg;
                return (
                  <View key={lv._id || i} style={styles.card}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                        <View style={[styles.chip, { backgroundColor: sb }]}><Text style={[styles.chipText, { color: sc }]}>{lv.status}</Text></View>
                        <View style={[styles.chip, { backgroundColor: theme.bg }]}><Text style={styles.chipText}>{lv.leaveType}</Text></View>
                      </View>
                      <Text style={styles.cardTitle}>{new Date(lv.startDate).toLocaleDateString()} → {new Date(lv.endDate).toLocaleDateString()}</Text>
                      {lv.reason ? <Text style={styles.cardDesc}>{lv.reason}</Text> : null}
                      {lv.reviewNote ? <View style={{ backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: theme.emeraldBorder }}><Text style={{ color: theme.emerald, fontSize: 11 }}>{lv.reviewNote}</Text></View> : null}
                    </View>
                  </View>
                );
              })
            }
          </ScrollView>
        )}

        {/* CIRCULARS */}
        {activeTab === 'circulars' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>School Circulars</Text>
            {circulars.length === 0 ? <EmptyState icon="document-text-outline" text="No circulars at this time." /> :
              circulars.map((c, i) => (
                <View key={c._id || i} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    <Text style={styles.cardDesc}>{c.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Text style={{ color: theme.emerald, fontSize: 10, fontWeight: '700', backgroundColor: theme.emeraldBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>{c.targetType === 'CLASS' ? `${c.targetGrade}-${c.targetSection}` : 'All'}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
              ))
            }
          </ScrollView>
        )}

        {/* TRANSPORT */}
        {activeTab === 'transport' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Transport</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {[{ id: 'mybus', label: 'My Bus' }, { id: 'roster', label: 'Class Roster' }].map(t => (
                <TouchableOpacity key={t.id} style={[styles.chip, transportSubTab === t.id && styles.chipActive]} onPress={() => setTransportSubTab(t.id)}>
                  <Text style={[styles.chipText, transportSubTab === t.id && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {transportSubTab === 'mybus' && (
              !myTransport ? <EmptyState icon="bus-outline" text="No transport assigned to you." /> :
              <View style={[styles.card, { flexDirection: 'column', gap: 10 }]}>
                <Text style={styles.cardTitle}>{myTransport.routeName}</Text>
                <Text style={styles.cardDesc}>🚌 Bus #{myTransport.busNumber || 'N/A'}</Text>
                <View style={{ backgroundColor: theme.bg, borderRadius: 10, padding: 10, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>Driver: {myTransport.driverName || 'N/A'}</Text>
                  <Text style={{ color: theme.textSub, fontSize: 12 }}>📞 {myTransport.driverPhone || 'N/A'}</Text>
                </View>
                {myTransport.stopName && <View style={{ backgroundColor: theme.emeraldBg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.emeraldBorder }}>
                  <Text style={{ color: theme.emerald, fontWeight: '700' }}>Stop: {myTransport.stopName}</Text>
                  <Text style={{ color: theme.emerald, fontSize: 12 }}>Pickup: {myTransport.pickupTime || '-'} • Drop: {myTransport.dropTime || '-'}</Text>
                </View>}
              </View>
            )}
            {transportSubTab === 'roster' && (
              classRoster.length === 0 ? <EmptyState icon="people-outline" text="No students assigned to a bus route." /> :
              classRoster.map((r, i) => (
                <View key={r.studentId || i} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.studentName}</Text>
                    <Text style={styles.cardDesc}>🚌 {r.routeName} • Stop: {r.stopName}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Pickup: {r.pickupTime || '-'} • Drop: {r.dropTime || '-'}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* LIBRARY */}
        {activeTab === 'library' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Library</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {[{ id: 'books', label: 'All Books' }, { id: 'issues', label: 'Issued Books' }].map(t => (
                <TouchableOpacity key={t.id} style={[styles.chip, libSubTab === t.id && styles.chipActive]} onPress={() => setLibSubTab(t.id)}>
                  <Text style={[styles.chipText, libSubTab === t.id && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {libSubTab === 'books' && (
              libBooks.length === 0 ? <EmptyState icon="library-outline" text="No books in the library yet." /> :
              libBooks.map((b, i) => (
                <View key={b._id || i} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.title}</Text>
                    <Text style={styles.cardDesc}>by {b.author || '-'} • {b.category}</Text>
                    <Text style={{ color: theme.emerald, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Available: {b.availableCopies}/{b.totalCopies}</Text>
                  </View>
                </View>
              ))
            )}
            {libSubTab === 'issues' && (
              libIssues.length === 0 ? <EmptyState icon="library-outline" text="No books currently issued." /> :
              libIssues.map((iss, i) => (
                <View key={iss._id || i} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{iss.bookTitle}</Text>
                    <Text style={styles.cardDesc}>Student: {iss.studentName || '-'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Text style={{ color: iss.status === 'OVERDUE' ? theme.error : theme.amber, fontSize: 11, fontWeight: '700' }}>{iss.status}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>Due: {new Date(iss.dueDate).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

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
  tabActive: { backgroundColor: theme.amber, borderColor: theme.amber },
  tabText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  formTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  fieldLabel: { color: theme.textSub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 14, marginBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
  chipActive: { backgroundColor: theme.amber, borderColor: theme.amber },
  chipText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: theme.amber, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.amber, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  annStripe: { width: 3, borderRadius: 2, backgroundColor: theme.amber },
  cardTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardSub: { color: theme.textSub, fontSize: 12, marginBottom: 4 },
  cardDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, flex: 1 },
  pollOption: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.bg, borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: theme.border },
  pollCount: { color: theme.textMuted, fontSize: 12 },
  memCard: { backgroundColor: theme.surface, borderRadius: theme.radius, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memImage: { width: '100%', height: 180 },
  perfCard: { borderRadius: theme.radius, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4, backgroundColor: '#4338ca', overflow: 'hidden' },
  perfTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  perfSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  perfPill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 60 },
  perfPillNum: { color: '#fff', fontSize: 18, fontWeight: '900' },
  perfPillLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  perfBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  perfBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
