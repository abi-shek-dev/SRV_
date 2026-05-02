import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, BookOpen, User, MapPin, Calendar } from 'lucide-react';
import API_URL from '../config/api.js';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

const DAY_COLORS = {
  MON: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-600', pill: 'bg-blue-100 text-blue-700' },
  TUE: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-600', pill: 'bg-indigo-100 text-indigo-700' },
  WED: { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-600', pill: 'bg-violet-100 text-violet-700' },
  THU: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-600', pill: 'bg-emerald-100 text-emerald-700' },
  FRI: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-600', pill: 'bg-amber-100 text-amber-700' },
  SAT: { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-600', pill: 'bg-rose-100 text-rose-700' },
};

export function FacultyTimetableSection({ grade, section }) {
  const [timetable, setTimetable] = useState({ periods: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = days[new Date().getDay()];
    return DAYS.includes(today) ? today : 'MON';
  });

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!grade || !section) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center text-slate-500">
        No class assignment found. Please contact admin.
      </div>
    );
  }

  const hasTimetable = timetable.periods && timetable.periods.length > 0;

  if (!hasTimetable) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center">
        <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-500">No timetable found for Class {grade}-{section}</p>
        <p className="text-sm text-slate-400 mt-1">Ask your admin to set up the timetable.</p>
      </div>
    );
  }

  const todayPeriods = timetable.grouped?.[activeDay] || [];
  const allDaysWithData = DAYS.filter(d => (timetable.grouped?.[d] || []).length > 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Class Timetable</p>
            <h2 className="text-2xl font-bold">Grade {grade} - Section {section}</h2>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="rounded-full bg-white/20 px-3 py-1 font-bold">{timetable.periods.length} periods scheduled</span>
          <span className="rounded-full bg-white/20 px-3 py-1 font-bold">{allDaysWithData.length} days active</span>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-2 flex-wrap">
        {DAYS.map(day => {
          const dayPeriods = timetable.grouped?.[day] || [];
          const colors = DAY_COLORS[day];
          const isActive = activeDay === day;
          const isToday = (() => {
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return days[new Date().getDay()] === day;
          })();
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`relative rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? `${colors.header} text-white shadow-lg`
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {DAY_LABELS[day].slice(0, 3)}
              {isToday && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
              )}
              {dayPeriods.length > 0 && (
                <span className={`ml-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {dayPeriods.length}P
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Period Cards for selected day */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold text-slate-900">{DAY_LABELS[activeDay]}</h3>
          {(() => {
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return days[new Date().getDay()] === activeDay ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Today</span>
            ) : null;
          })()}
        </div>

        {todayPeriods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-400">
            <p className="font-bold">No classes scheduled</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayPeriods
              .sort((a, b) => a.periodNumber - b.periodNumber)
              .map(period => {
                const colors = DAY_COLORS[activeDay];
                return (
                  <div
                    key={period._id}
                    className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 transition hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-black ${colors.pill}`}>
                        P{period.periodNumber}
                      </div>
                      {period.startTime && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={12} />
                          <span>{period.startTime} – {period.endTime}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-lg font-bold text-slate-900">{period.subject || '—'}</p>
                    {period.teacherName && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <User size={13} />
                        <span>{period.teacherName}</span>
                      </div>
                    )}
                    {period.room && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={11} />
                        <span>Room {period.room}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Full Weekly Grid (desktop) */}
      <div className="hidden lg:block">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Full Weekly Schedule</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left font-bold text-slate-300 w-16">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="px-4 py-3 text-center font-bold">
                    <span className={`inline-block rounded-lg px-2 py-0.5 text-xs ${
                      (() => {
                        const ds = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
                        return ds[new Date().getDay()] === day ? 'bg-emerald-500 text-white' : 'text-slate-300';
                      })()
                    }`}>
                      {day}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxPeriod = Math.max(...timetable.periods.map(p => p.periodNumber), 0);
                return Array.from({ length: maxPeriod }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <tr key={pNum} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-black text-slate-700 text-center">P{pNum}</td>
                      {DAYS.map(day => {
                        const period = timetable.periods.find(p => p.dayOfWeek === day && p.periodNumber === pNum);
                        return (
                          <td key={day} className="px-3 py-2 text-center">
                            {period && period.subject ? (
                              <div className="text-left">
                                <p className="font-bold text-slate-900 text-xs">{period.subject}</p>
                                {period.teacherName && <p className="text-[10px] text-slate-500 truncate">{period.teacherName}</p>}
                                {period.startTime && <p className="text-[10px] text-slate-400">{period.startTime}</p>}
                              </div>
                            ) : (
                              <span className="text-slate-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
