import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CalendarDays, Send } from 'lucide-react';
import API_URL from '../config/api.js';

export function ParentLeaveSection() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      Swal.fire('Required', 'Please select start and end dates', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/parent/leave`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Leave request submitted', showConfirmButton: false, timer: 2000 });
      setForm({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-display font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-blue-600" /> Request Leave
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Type</label>
              <select 
                value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="EMERGENCY">Emergency Leave</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                <input 
                  type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date</label>
                <input 
                  type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason (Optional)</label>
              <textarea 
                rows="3" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description..."
              />
            </div>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : <><Send size={18} /> Submit Request</>}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {loading ? (
           <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div></div>
        ) : leaves.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
            You have not submitted any leave requests.
          </div>
        ) : (
          leaves.map(leave => (
            <div key={leave._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{leave.leaveType} Leave</p>
                  <p className="text-sm text-slate-500">
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {leave.status}
                </span>
              </div>
              {leave.reason && <p className="mt-3 text-sm text-slate-600">"{leave.reason}"</p>}
              {leave.reviewNote && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-1">Faculty Note</span>
                  {leave.reviewNote}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
