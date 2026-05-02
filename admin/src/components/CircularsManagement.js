import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Trash2, Megaphone, Plus, Calendar, FileText, Users as UsersIcon } from 'lucide-react';
import { API_URL } from '../config/api.js';

const CircularsManagement = () => {
  const [circulars, setCirculars] = useState([]);
  const [circForm, setCircForm] = useState({ title: '', description: '', fileUrl: '', targetType: 'GLOBAL', targetGrade: '', targetSection: '' });
  const [circLoading, setCircLoading] = useState(false);

  const GRADE_LIST = ['Pre KG', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  useEffect(() => { loadCirculars(); }, []);

  const loadCirculars = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/admin/circulars`, { headers: { Authorization: `Bearer ${token}` } });
      setCirculars(res.data);
    } catch (err) {}
  };

  const publishCircular = async () => {
    if (!circForm.title) return;
    setCircLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/admin/circulars`, circForm, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Circular published!', showConfirmButton: false, timer: 2000 });
      setCircForm({ title: '', description: '', fileUrl: '', targetType: 'GLOBAL', targetGrade: '', targetSection: '' });
      loadCirculars();
    } catch (err) { Swal.fire('Error', 'Failed to publish', 'error'); }
    finally { setCircLoading(false); }
  };

  const deleteCircular = async (id) => {
    const r = await Swal.fire({ title: 'Delete circular?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!r.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/circulars/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadCirculars();
    } catch (err) {}
  };

  const fieldCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition placeholder:font-normal placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-500">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
             <Megaphone size={18} color="white" />
           </div>
           <div>
             <h3 className="text-sm font-black text-white tracking-tight">Publish New Circular</h3>
             <p className="text-xs text-emerald-100">Send announcements to parents and students</p>
           </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Circular Title *</label>
            <input placeholder="e.g. Annual Day Celebration 2024" value={circForm.title} onChange={e => setCircForm(f => ({ ...f, title: e.target.value }))} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Description / Content</label>
            <textarea placeholder="Write the main message here..." rows={4} value={circForm.description} onChange={e => setCircForm(f => ({ ...f, description: e.target.value }))} className={`${fieldCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Attachment URL (Optional)</label>
            <input placeholder="Paste Google Drive or PDF link" value={circForm.fileUrl} onChange={e => setCircForm(f => ({ ...f, fileUrl: e.target.value }))} className={fieldCls} />
          </div>
          
          <div className="flex flex-wrap items-end gap-3 pt-2">
            <div className="flex-1 min-w-[150px]">
              <label className={labelCls}>Target Audience</label>
              <select value={circForm.targetType} onChange={e => setCircForm(f => ({ ...f, targetType: e.target.value }))} className={fieldCls}>
                <option value="GLOBAL">All Parents</option>
                <option value="CLASS">Specific Class Only</option>
              </select>
            </div>
            
            {circForm.targetType === 'CLASS' && (
              <>
                <div className="w-32">
                  <label className={labelCls}>Grade</label>
                  <select value={circForm.targetGrade} onChange={e => setCircForm(f => ({ ...f, targetGrade: e.target.value }))} className={fieldCls}>
                    <option value="">Grade</option>
                    {GRADE_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className={labelCls}>Section</label>
                  <select value={circForm.targetSection} onChange={e => setCircForm(f => ({ ...f, targetSection: e.target.value }))} className={fieldCls}>
                    <option value="">Section</option>
                    {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
            
            <button onClick={publishCircular} disabled={!circForm.title || circLoading} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50">
              {circLoading ? 'Publishing...' : 'Publish Circular'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {circulars.map(c => (
          <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-start gap-4 transition hover:shadow-md">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 truncate">{c.title}</h4>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  <UsersIcon size={10} />
                  {c.targetType === 'CLASS' ? `${c.targetGrade}-${c.targetSection}` : 'Global'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <Calendar size={10} />
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
                {c.fileUrl && (
                  <a href={c.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:underline">
                    📎 Attachment
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => deleteCircular(c._id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
          </div>
        ))}
        {circulars.length === 0 && (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            <Megaphone size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No circulars published yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularsManagement;
