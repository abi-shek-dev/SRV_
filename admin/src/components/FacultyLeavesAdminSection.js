import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import API_URL from '../config/api.js';

export function FacultyLeavesAdminSection() {
  const [leaves, setLeaves] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('schoolToken');
    const params = leaveFilter ? `?status=${leaveFilter}` : '';
    axios.get(`${API_URL}/api/admin/faculty-leaves${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setLeaves(res.data))
      .catch(console.error)
      .finally(() => setLeaveLoading(false));
  }, [leaveFilter]);

  const handleAction = async (id, status) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${API_URL}/api/admin/faculty-leaves/${id}`, { status, reviewNote }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Leave ${status.toLowerCase()}`, showConfirmButton: false, timer: 2000 });
      setReviewingId(null); setReviewNote('');
      setLeaves(prev => prev.map(l => l._id === id ? { ...l, status, reviewNote } : l));
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update', 'error');
    }
  };

  if (leaveLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => { setLeaveLoading(true); setLeaveFilter(s); }}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${leaveFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {leaves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center text-slate-500">No faculty leave requests found.</div>
      ) : leaves.map(leave => (
        <div key={leave._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">{leave.facultyName}</p>
              <p className="text-sm text-slate-500">Faculty ID: {leave.facultyId}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {leave.status}
            </span>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div><span className="font-semibold text-slate-600">Type:</span> {leave.leaveType}</div>
            <div><span className="font-semibold text-slate-600">From:</span> {new Date(leave.startDate).toLocaleDateString()}</div>
            <div><span className="font-semibold text-slate-600">To:</span> {new Date(leave.endDate).toLocaleDateString()}</div>
          </div>
          {leave.reason && <p className="mt-2 text-sm text-slate-600 italic">"{leave.reason}"</p>}
          {leave.reviewNote && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><span className="font-bold">Review Note:</span> {leave.reviewNote}</p>}

          {leave.status === 'PENDING' && (
            <div className="mt-4 space-y-3">
              {reviewingId === leave._id ? (
                <>
                  <input type="text" placeholder="Optional note..." value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(leave._id, 'APPROVED')} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Approve</button>
                    <button onClick={() => handleAction(leave._id, 'REJECTED')} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">Reject</button>
                    <button onClick={() => { setReviewingId(null); setReviewNote(''); }} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Cancel</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setReviewingId(leave._id)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100">Review</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
