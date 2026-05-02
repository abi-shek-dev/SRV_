import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Save, Trash2, Clock, BookOpen, User, MapPin, Pencil, CalendarDays, ChevronDown, Loader2 } from 'lucide-react';
import API_URL from '../config/api.js';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

// Color palette per subject (cycles through if needed)
const SUBJECT_COLORS = [
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', sub: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-900',    sub: 'text-sky-600',    badge: 'bg-sky-100 text-sky-700',    dot: 'bg-sky-500'    },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-900',sub: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500'},
  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-900',  sub: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-900',   sub: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700',   dot: 'bg-rose-500'   },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', sub: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-900',   sub: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700',   dot: 'bg-pink-500'   },
  { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-900',   sub: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500'   },
];

const subjectColorMap = {};
let colorIdx = 0;
function getSubjectColor(subject) {
  if (!subject) return null;
  const key = subject.trim().toLowerCase();
  if (!subjectColorMap[key]) {
    subjectColorMap[key] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
    colorIdx++;
  }
  return subjectColorMap[key];
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

const GRADES = ['Pre KG', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export function TimetableManagement() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxPeriod, setMaxPeriod] = useState(8);
  const [loaded, setLoaded] = useState(false);

  const [editingCell, setEditingCell] = useState(null);
  const [cellForm, setCellForm] = useState({ subject: '', teacherName: '', room: '', startTime: '', endTime: '' });

  const loadTimetable = async () => {
    if (!grade || !section) {
      Swal.fire({ icon: 'warning', title: 'Select Grade & Section', text: 'Please choose both before loading.', confirmButtonColor: '#6366f1' });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/timetable/${grade}/${section}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedPeriods = res.data.periods || [];
      setPeriods(fetchedPeriods);
      let maxP = 8;
      fetchedPeriods.forEach(p => { if (p.periodNumber > maxP) maxP = p.periodNumber; });
      setMaxPeriod(maxP);
      setLoaded(true);
    } catch {
      Swal.fire('Error', 'Failed to load timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPeriod = (day, pNum) => periods.find(p => p.dayOfWeek === day && p.periodNumber === pNum);

  const openEditor = (day, pNum) => {
    const existing = getPeriod(day, pNum);
    setEditingCell({ dayOfWeek: day, periodNumber: pNum });
    setCellForm({
      subject: existing?.subject || '',
      teacherName: existing?.teacherName || '',
      room: existing?.room || '',
      startTime: existing?.startTime || '',
      endTime: existing?.endTime || ''
    });
  };

  const saveCell = () => {
    const newPeriods = [...periods];
    const idx = newPeriods.findIndex(p => p.dayOfWeek === editingCell.dayOfWeek && p.periodNumber === editingCell.periodNumber);
    const cellData = { dayOfWeek: editingCell.dayOfWeek, periodNumber: editingCell.periodNumber, ...cellForm };
    if (idx >= 0) newPeriods[idx] = cellData; else newPeriods.push(cellData);
    setPeriods(newPeriods);
    setEditingCell(null);
  };

  const deleteCell = () => {
    setPeriods(periods.filter(p => !(p.dayOfWeek === editingCell.dayOfWeek && p.periodNumber === editingCell.periodNumber)));
    setEditingCell(null);
  };

  const saveTimetable = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/timetable`, { grade, section, periods }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Timetable saved!', showConfirmButton: false, timer: 2000 });
    } catch {
      Swal.fire('Error', 'Failed to save timetable', 'error');
    }
  };

  const clearTimetable = async () => {
    const result = await Swal.fire({
      title: 'Clear Timetable?',
      text: `This will remove all periods for Class ${grade}-${section}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear it!'
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/timetable/${grade}/${section}`, { headers: { Authorization: `Bearer ${token}` } });
      setPeriods([]);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Timetable cleared', showConfirmButton: false, timer: 2000 });
    } catch {
      Swal.fire('Error', 'Failed to clear timetable', 'error');
    }
  };

  const filledCount = periods.filter(p => p.subject).length;
  const totalCells = DAYS.length * maxPeriod;

  return (
    <div className="space-y-6 max-w-full">

      {/* ── Controls Card ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Grade */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Grade</label>
            <div className="relative">
              <select
                value={grade}
                onChange={e => { setGrade(e.target.value); setLoaded(false); }}
                className="appearance-none w-40 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
              >
                <option value="">Select Grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Section */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Section</label>
            <div className="relative">
              <select
                value={section}
                onChange={e => { setSection(e.target.value); setLoaded(false); }}
                className="appearance-none w-36 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
              >
                <option value="">Select Section</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Load Button */}
          <button
            onClick={loadTimetable}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
            {loading ? 'Loading…' : 'Load Timetable'}
          </button>

          {/* Stats pill */}
          {loaded && (
            <div className="ml-auto flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-slate-500">
                {filledCount} / {totalCells} periods filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Timetable Grid ── */}
      {loaded && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen size={18} />
                Class {grade}-{section} Timetable
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">Click any cell to add or edit a period</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMaxPeriod(m => m + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-2 text-xs font-bold text-white border border-white/30 transition backdrop-blur-sm"
              >
                <Plus size={14} /> Add Period
              </button>
              <button
                onClick={saveTimetable}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
              >
                <Save size={14} /> Save Changes
              </button>
              <button
                onClick={clearTimetable}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 px-3 py-2 text-xs font-bold text-white border border-white/20 transition"
                title="Clear entire timetable"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${120 + maxPeriod * 155}px` }}>
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 w-28 sticky left-0 bg-slate-50 z-10">
                    Day
                  </th>
                  {Array.from({ length: maxPeriod }).map((_, i) => (
                    <th key={i} className="px-4 py-3 border-b border-l border-slate-100 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 min-w-[155px]">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600">{i + 1}</span>
                        Period
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIdx) => (
                  <tr key={day} className={dayIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {/* Day label */}
                    <td className={`px-5 py-3 border-b border-slate-100 sticky left-0 z-10 ${dayIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 tracking-wide">{day}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{DAY_LABELS[day]}</span>
                      </div>
                    </td>

                    {/* Period cells */}
                    {Array.from({ length: maxPeriod }).map((_, i) => {
                      const pNum = i + 1;
                      const pData = getPeriod(day, pNum);
                      const colors = pData?.subject ? getSubjectColor(pData.subject) : null;

                      return (
                        <td key={pNum} className="p-2 border-b border-l border-slate-100 align-top">
                          <button
                            onClick={() => openEditor(day, pNum)}
                            className={`group w-full min-h-[88px] rounded-xl border text-left p-2.5 transition-all duration-200 ${
                              colors
                                ? `${colors.bg} ${colors.border} hover:shadow-md hover:scale-[1.02]`
                                : 'bg-white border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                            }`}
                          >
                            {pData?.subject ? (
                              <div className="flex flex-col gap-1.5 h-full">
                                {/* Subject */}
                                <div className="flex items-start justify-between gap-1">
                                  <div className={`flex items-center gap-1.5`}>
                                    <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${colors.dot}`}></span>
                                    <span className={`text-[13px] font-black leading-tight ${colors.text}`}>{pData.subject}</span>
                                  </div>
                                  <Pencil size={11} className={`flex-shrink-0 opacity-0 group-hover:opacity-60 transition ${colors.sub}`} />
                                </div>
                                {/* Teacher */}
                                {pData.teacherName && (
                                  <div className={`flex items-center gap-1 text-[11px] font-semibold ${colors.sub}`}>
                                    <User size={10} />
                                    <span className="line-clamp-1">{pData.teacherName}</span>
                                  </div>
                                )}
                                {/* Time & Room */}
                                <div className="flex flex-wrap gap-1 mt-auto">
                                  {pData.startTime && (
                                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                                      <Clock size={8} />
                                      {formatTime(pData.startTime)}
                                    </span>
                                  )}
                                  {pData.room && (
                                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                                      <MapPin size={8} />
                                      {pData.room}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={18} className="text-indigo-400" />
                                <span className="text-[10px] font-semibold text-indigo-400">Add Period</span>
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loaded && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <CalendarDays size={26} className="text-indigo-500" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Timetable Loaded</h3>
          <p className="mt-1 text-sm text-slate-400">Select a grade and section above, then click <strong>Load Timetable</strong>.</p>
        </div>
      )}

      {/* ── Editor Modal ── */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Pencil size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Edit Period {editingCell.periodNumber}</h3>
                  <p className="text-xs text-indigo-200">{DAY_LABELS[editingCell.dayOfWeek]}</p>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Subject</label>
                <input
                  type="text"
                  value={cellForm.subject}
                  onChange={e => setCellForm({ ...cellForm, subject: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder:font-normal"
                  placeholder="e.g. Mathematics"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Teacher</label>
                <input
                  type="text"
                  value={cellForm.teacherName}
                  onChange={e => setCellForm({ ...cellForm, teacherName: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder:font-normal"
                  placeholder="e.g. Mr. Sharma"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Room / Hall</label>
                <input
                  type="text"
                  value={cellForm.room}
                  onChange={e => setCellForm({ ...cellForm, room: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder:font-normal"
                  placeholder="e.g. 101"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Start Time</label>
                  <input
                    type="time"
                    value={cellForm.startTime}
                    onChange={e => setCellForm({ ...cellForm, startTime: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">End Time</label>
                  <input
                    type="time"
                    value={cellForm.endTime}
                    onChange={e => setCellForm({ ...cellForm, endTime: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-2 px-6 pb-6">
              <button
                onClick={deleteCell}
                className="flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 px-4 py-2.5 text-sm font-bold text-red-500 border border-red-100 transition-all"
              >
                <Trash2 size={14} /> Clear
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCell(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCell}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all"
                >
                  <Save size={14} /> Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
