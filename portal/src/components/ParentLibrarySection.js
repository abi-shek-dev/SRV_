import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookMarked, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import API_URL from '../config/api.js';

export function ParentLibrarySection() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/parent/library`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIssues(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const activeIssues = issues.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE');
  const pastIssues = issues.filter(i => i.status === 'RETURNED');

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 p-6 text-white shadow-xl relative overflow-hidden">
        <BookMarked size={120} className="absolute -bottom-4 -right-4 text-white/10" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Library Records</p>
          <h2 className="mt-1 text-3xl font-bold">My Books</h2>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur">
              <p className="text-[10px] uppercase font-bold text-indigo-100 mb-1">Currently Borrowed</p>
              <p className="text-xl font-bold">{activeIssues.length}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur">
              <p className="text-[10px] uppercase font-bold text-indigo-100 mb-1">Total Read</p>
              <p className="text-xl font-bold">{pastIssues.length}</p>
            </div>
          </div>
        </div>
      </div>

      {activeIssues.length === 0 && pastIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-500">
          <BookMarked size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold">No Library Records</p>
          <p className="text-sm mt-1">Your child hasn't borrowed any books from the library yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Books */}
          {activeIssues.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Currently Borrowed</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeIssues.map(issue => {
                  const isOverdue = issue.status === 'OVERDUE' || new Date() > new Date(issue.dueDate);
                  return (
                    <div key={issue._id} className={`rounded-2xl border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'} p-5 shadow-sm`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 text-lg leading-tight pr-4">{issue.bookTitle}</h4>
                        {isOverdue ? (
                          <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                            <AlertTriangle size={12} /> Overdue
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                            Issued
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-4">By {issue.bookAuthor}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white/50 rounded-lg p-2 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Issued On</p>
                          <p className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} />
                            {new Date(issue.issuedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`bg-white/50 rounded-lg p-2 border ${isOverdue ? 'border-red-100' : 'border-slate-100'}`}>
                          <p className={`text-[10px] font-bold uppercase ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>Due Date</p>
                          <p className={`font-semibold flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                            <Calendar size={12} />
                            {new Date(issue.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past History */}
          {pastIssues.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Reading History</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {pastIssues.map(issue => (
                    <div key={issue._id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{issue.bookTitle}</h4>
                        <p className="text-xs text-slate-500 truncate">By {issue.bookAuthor}</p>
                        <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-slate-500">
                          <span>Issued: {new Date(issue.issuedDate).toLocaleDateString()}</span>
                          <span>Returned: {new Date(issue.returnedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-bold uppercase">
                          <CheckCircle2 size={14} /> Returned
                        </span>
                        {issue.fineAmount > 0 && (
                          <p className="text-red-500 text-xs font-bold mt-1">Fine: ₹{issue.fineAmount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
