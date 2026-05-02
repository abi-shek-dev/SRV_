import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Save, Trash2, Clock, Edit2 } from 'lucide-react';
import API_URL from '../config/api.js';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function TimetableManagement() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxPeriod, setMaxPeriod] = useState(8);

  const [editingCell, setEditingCell] = useState(null); // { dayOfWeek, periodNumber }
  const [cellForm, setCellForm] = useState({ subject: '', teacherName: '', room: '', startTime: '', endTime: '' });

  const loadTimetable = async () => {
    if (!grade || !section) {
      Swal.fire('Required', 'Please select Grade and Section first', 'warning');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/timetable/${grade}/${section}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeriods(res.data.periods || []);
      
      // Calculate max period
      let maxP = 8;
      (res.data.periods || []).forEach(p => {
        if (p.periodNumber > maxP) maxP = p.periodNumber;
      });
      setMaxPeriod(maxP);
    } catch (err) {
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
    
    const cellData = {
      dayOfWeek: editingCell.dayOfWeek,
      periodNumber: editingCell.periodNumber,
      ...cellForm
    };

    if (idx >= 0) {
      newPeriods[idx] = cellData;
    } else {
      newPeriods.push(cellData);
    }
    setPeriods(newPeriods);
    setEditingCell(null);
  };

  const deleteCell = () => {
    const newPeriods = periods.filter(p => !(p.dayOfWeek === editingCell.dayOfWeek && p.periodNumber === editingCell.periodNumber));
    setPeriods(newPeriods);
    setEditingCell(null);
  };

  const saveTimetable = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/timetable`, {
        grade, section, periods
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Timetable Saved', showConfirmButton: false, timer: 2000 });
    } catch (err) {
      Swal.fire('Error', 'Failed to save timetable', 'error');
    }
  };

  const clearTimetable = async () => {
    if (!await Swal.fire({ title: 'Clear entirely?', text: 'This will remove all periods for this class.', icon: 'warning', showCancelButton: true }).then(r => r.isConfirmed)) return;
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/timetable/${grade}/${section}`, { headers: { Authorization: `Bearer ${token}` } });
      setPeriods([]);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cleared', showConfirmButton: false, timer: 2000 });
    } catch (err) {
      Swal.fire('Error', 'Failed to clear timetable', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-auto">
      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Grade</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-40 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select Grade</option>
              {['Pre KG', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="mt-1 w-40 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select Section</option>
              {['A', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={loadTimetable} disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition hover:bg-indigo-700">
            {loading ? 'Loading...' : 'Load Timetable'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {grade && section && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Class {grade}-{section} Timetable</h3>
              <p className="text-sm text-slate-500">Click any cell to edit the period.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMaxPeriod(m => m + 1)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"><Plus size={16}/> Add Period Column</button>
              <button onClick={saveTimetable} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"><Save size={16}/> Save Changes</button>
              <button onClick={clearTimetable} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-200"><Trash2 size={16}/></button>
            </div>
          </div>

          <div className="min-w-max border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3 border-b border-r w-24 text-center">Day</th>
                  {Array.from({length: maxPeriod}).map((_, i) => (
                    <th key={i} className="px-4 py-3 border-b border-r min-w-[140px] text-center">Period {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day} className="border-b last:border-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 border-r font-bold text-slate-900 text-center">{day}</td>
                    {Array.from({length: maxPeriod}).map((_, i) => {
                      const pNum = i + 1;
                      const pData = getPeriod(day, pNum);
                      return (
                        <td key={pNum} className="p-2 border-r align-top relative cursor-pointer group" onClick={() => openEditor(day, pNum)}>
                          <div className={`min-h-[80px] p-2 rounded-lg border ${pData && pData.subject ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-dashed border-slate-300'} group-hover:border-indigo-400 transition`}>
                            {pData && pData.subject ? (
                              <>
                                <p className="font-bold text-indigo-900">{pData.subject}</p>
                                <p className="text-xs text-indigo-700 mt-1 line-clamp-1">{pData.teacherName}</p>
                                {(pData.startTime || pData.room) && (
                                  <div className="mt-2 text-[10px] text-indigo-500 font-semibold flex flex-wrap gap-1">
                                    {pData.startTime && <span className="bg-white px-1.5 py-0.5 rounded shadow-sm">{pData.startTime} - {pData.endTime}</span>}
                                    {pData.room && <span className="bg-white px-1.5 py-0.5 rounded shadow-sm">Rm: {pData.room}</span>}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Plus size={20} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900 border-b pb-2">Edit {editingCell.dayOfWeek} - Period {editingCell.periodNumber}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Subject</label>
                <input type="text" value={cellForm.subject} onChange={e => setCellForm({...cellForm, subject: e.target.value})} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Teacher</label>
                <input type="text" value={cellForm.teacherName} onChange={e => setCellForm({...cellForm, teacherName: e.target.value})} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Mr. Sharma" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Room</label>
                <input type="text" value={cellForm.room} onChange={e => setCellForm({...cellForm, room: e.target.value})} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 101" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Start Time</label>
                  <input type="time" value={cellForm.startTime} onChange={e => setCellForm({...cellForm, startTime: e.target.value})} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">End Time</label>
                  <input type="time" value={cellForm.endTime} onChange={e => setCellForm({...cellForm, endTime: e.target.value})} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <button onClick={deleteCell} className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-200">Clear Cell</button>
              <div className="flex gap-2">
                <button onClick={() => setEditingCell(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
                <button onClick={saveCell} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
