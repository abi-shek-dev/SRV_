import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, BookOpen, User, MapPin, ChevronRight } from 'lucide-react';
import API_URL from '../config/api.js';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200',
];

function getSubjectColor(subject) {
  if (!subject) return SUBJECT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

export function ParentTimetableSection({ studentData }) {
  const [timetable, setTimetable] = useState({ periods: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = days[new Date().getDay()];
    return DAYS.includes(today) ? today : 'MON';
  });

  const grade = studentData?.grade;
  const section = studentData?.section;
  const studentName = studentData?.name;

  useEffect(() => {
    if (!grade || !section) {
      setLoading(false);
      return;
    }
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/timetable/${grade}/${section}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTimetable(res.data);
      } catch (err) {
        console.error('Failed to load timetable', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [grade, section]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!grade || !section) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center text-slate-500">
        Student class information is missing. Please contact the school administration.
      </div>
    );
  }

  const hasTimetable = timetable.periods && timetable.periods.length > 0;

  // Today's schedule prominently featured
  const todayDay = (() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  })();
  const todayPeriods = DAYS.includes(todayDay) ? (timetable.grouped?.[todayDay] || []) : [];
  const activePeriods = timetable.grouped?.[activeDay] || [];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Class Timetable</p>
            <h2 className="text-2xl font-bold">{studentName || 'Your Child'}</h2>
            <p className="text-sm text-emerald-100">Grade {grade} – Section {section}</p>
          </div>
        </div>

        {/* Today's at-a-glance */}
        {DAYS.includes(todayDay) && todayPeriods.length > 0 && (
          <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-3">
              Today's Schedule — {DAY_LABELS[todayDay]}
            </p>
            <div className="flex flex-wrap gap-2">
              {todayPeriods
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map(period => (
                  <div key={period._id} className="rounded-xl bg-white/20 px-3 py-2 text-sm backdrop-blur">
                    <span className="font-black text-white/60 text-xs mr-1">P{period.periodNumber}</span>
                    <span className="font-bold">{period.subject}</span>
                    {period.startTime && <span className="ml-2 text-xs text-white/70">{period.startTime}</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
        {DAYS.includes(todayDay) && todayPeriods.length === 0 && (
          <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur text-center text-white/80 text-sm font-semibold">
            No classes today ({DAY_LABELS[todayDay]})
          </div>
        )}
      </div>

      {!hasTimetable ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-500">Timetable not yet set up</p>
          <p className="text-sm text-slate-400 mt-1">Your school hasn't added a timetable for Grade {grade}-{section} yet.</p>
        </div>
      ) : (
        <>
          {/* Day Tabs */}
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const isActive = activeDay === day;
              const isToday = todayDay === day;
              const count = (timetable.grouped?.[day] || []).length;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`relative rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {DAY_LABELS[day].slice(0, 3)}
                  {isToday && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" />
                  )}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs font-semibold ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Period list */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold text-slate-900">{DAY_LABELS[activeDay]}</h3>
              {activeDay === todayDay && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Today</span>
              )}
              <span className="text-sm text-slate-400">{activePeriods.length} period{activePeriods.length !== 1 ? 's' : ''}</span>
            </div>

            {activePeriods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-400">
                <p className="font-bold">No classes scheduled for {DAY_LABELS[activeDay]}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activePeriods
                  .sort((a, b) => a.periodNumber - b.periodNumber)
                  .map((period, idx) => {
                    const colorClass = getSubjectColor(period.subject);
                    return (
                      <div
                        key={period._id}
                        className={`rounded-2xl border p-4 flex items-start gap-4 transition hover:shadow-md bg-white ${colorClass.split(' ').find(c => c.startsWith('border')) || 'border-slate-200'}`}
                      >
                        {/* Period number badge */}
                        <div className={`h-12 w-12 shrink-0 rounded-2xl border flex items-center justify-center font-black text-sm ${colorClass}`}>
                          P{period.periodNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-slate-900">{period.subject || 'Free Period'}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                            {period.teacherName && (
                              <span className="flex items-center gap-1">
                                <User size={13} /> {period.teacherName}
                              </span>
                            )}
                            {period.room && (
                              <span className="flex items-center gap-1">
                                <MapPin size={13} /> Room {period.room}
                              </span>
                            )}
                            {period.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={13} /> {period.startTime} – {period.endTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1" />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Full week summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Full Week Overview</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS.map(day => {
                const dayPeriods = (timetable.grouped?.[day] || []).sort((a, b) => a.periodNumber - b.periodNumber);
                const isToday = day === todayDay;
                return (
                  <div
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`rounded-xl border p-3 cursor-pointer transition hover:shadow-md ${
                      isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {DAY_LABELS[day]}
                      </p>
                      {isToday && <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">Today</span>}
                    </div>
                    {dayPeriods.length === 0 ? (
                      <p className="text-xs text-slate-400">No classes</p>
                    ) : (
                      <div className="space-y-1">
                        {dayPeriods.slice(0, 4).map(p => (
                          <div key={p._id} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="font-black text-slate-400">P{p.periodNumber}</span>
                            <span className="font-semibold truncate">{p.subject}</span>
                          </div>
                        ))}
                        {dayPeriods.length > 4 && (
                          <p className="text-xs text-slate-400 font-semibold">+{dayPeriods.length - 4} more</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
