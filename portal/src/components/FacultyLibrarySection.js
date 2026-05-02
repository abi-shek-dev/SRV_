import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookMarked, Search, Plus, Calendar, AlertTriangle, User, CheckCircle2 } from 'lucide-react';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';

export function FacultyLibrarySection() {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [issueForm, setIssueForm] = useState({ studentId: '', dueDate: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [booksRes, issuesRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/faculty/library/books`, { headers }),
        axios.get(`${API_URL}/api/faculty/library/issues`, { headers }),
        axios.get(`${API_URL}/api/faculty/students`, { headers })
      ]);
      
      setBooks(booksRes.data);
      setIssues(issuesRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load library data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/library/issue`, {
        bookId: selectedBook._id,
        studentId: issueForm.studentId,
        dueDate: issueForm.dueDate
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Book issued', showConfirmButton: false, timer: 2000 });
      setShowIssueModal(false);
      fetchData(); // refresh
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to issue book', 'error');
    }
  };

  const handleReturn = async (issueId) => {
    try {
      const result = await Swal.fire({
        title: 'Return Book?',
        text: "Mark this book as returned to the library.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Yes, return it'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('schoolToken');
        await axios.post(`${API_URL}/api/faculty/library/return/${issueId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Book returned', showConfirmButton: false, timer: 2000 });
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to return book', 'error');
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 p-6 text-white shadow-xl relative overflow-hidden">
        <BookMarked size={120} className="absolute -bottom-4 -right-4 text-white/10" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Library Management</p>
          <h2 className="mt-1 text-3xl font-bold">Class Reading</h2>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur">
              <p className="text-[10px] uppercase font-bold text-indigo-100 mb-1">Books Borrowed</p>
              <p className="text-xl font-bold">{issues.length}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur">
              <p className="text-[10px] uppercase font-bold text-indigo-100 mb-1">Total Books Available</p>
              <p className="text-xl font-bold">{books.reduce((acc, b) => acc + b.availableCopies, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side: Active Issues in Class */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-indigo-500" /> Currently Issued to Class
          </h3>
          {issues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-500">
              <BookMarked size={30} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold">No books issued</p>
              <p className="text-sm mt-1">None of your students currently have library books.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => {
                const isOverdue = issue.status === 'OVERDUE' || new Date() > new Date(issue.dueDate);
                return (
                  <div key={issue._id} className={`rounded-xl border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'} p-4 shadow-sm flex items-center justify-between gap-4`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 truncate">{issue.studentName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{issue.srvNumber}</span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700 truncate">{issue.bookTitle}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-500">
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                          Due: {new Date(issue.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReturn(issue._id)}
                      className="shrink-0 rounded-lg bg-emerald-50 text-emerald-600 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1 border border-emerald-200"
                    >
                      <CheckCircle2 size={14} /> Return
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Book Catalog */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookMarked size={20} className="text-purple-500" /> Book Catalog
          </h3>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-4">
            <Search className="text-slate-400 ml-2" size={18} />
            <input
              type="text"
              placeholder="Search library catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-slate-900"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {filteredBooks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No books found in catalog.</div>
              ) : (
                filteredBooks.map(book => (
                  <div key={book._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{book.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{book.author}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {book.availableCopies} available
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{book.category}</span>
                      </div>
                    </div>
                    <button
                      disabled={book.availableCopies <= 0}
                      onClick={() => { setSelectedBook(book); setShowIssueModal(true); }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1 ${
                        book.availableCopies > 0 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      <Plus size={14} /> Issue
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white">
              <h3 className="font-display font-bold text-xl">Issue Book</h3>
              <p className="text-indigo-200 text-sm">{selectedBook.title}</p>
            </div>
            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Student</label>
                <select
                  required
                  value={issueForm.studentId}
                  onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose from your class --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.srvNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={issueForm.dueDate}
                  onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowIssueModal(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700 shadow-md">Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
