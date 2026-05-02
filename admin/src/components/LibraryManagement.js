import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Library, Plus, Trash2, Search, Book, User, Calendar, BookOpen, Clock } from 'lucide-react';
import { API_URL } from '../config/api.js';

const LibraryManagement = () => {
  const [books, setBooks] = useState([]);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: '', totalCopies: 1 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadBooks(); }, []);

  const loadBooks = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/admin/library/books`, { headers: { Authorization: `Bearer ${token}` } });
      setBooks(res.data);
    } catch (err) {}
  };

  const addBook = async () => {
    if (!bookForm.title || !bookForm.author) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/admin/library/books`, bookForm, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Book added!', showConfirmButton: false, timer: 2000 });
      setBookForm({ title: '', author: '', isbn: '', category: '', totalCopies: 1 });
      loadBooks();
    } catch (err) { Swal.fire('Error', 'Failed to add book', 'error'); }
    finally { setLoading(false); }
  };

  const deleteBook = async (id) => {
    const r = await Swal.fire({ title: 'Remove book?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!r.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/library/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadBooks();
    } catch (err) {}
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fieldCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition placeholder:font-normal placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Add Book Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-500">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
             <Library size={18} color="white" />
           </div>
           <div>
             <h3 className="text-sm font-black text-white tracking-tight">Library Catalog</h3>
             <p className="text-xs text-violet-100">Manage school books and inventory</p>
           </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Book Title *</label>
              <input placeholder="e.g. Wings of Fire" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Author Name *</label>
              <input placeholder="e.g. A.P.J. Abdul Kalam" value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Category / Genre</label>
              <input placeholder="e.g. Science, Fiction" value={bookForm.category} onChange={e => setBookForm(f => ({ ...f, category: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>ISBN / Code</label>
              <input placeholder="Optional" value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Total Copies</label>
              <input type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm(f => ({ ...f, totalCopies: parseInt(e.target.value) || 1 }))} className={fieldCls} />
            </div>
            <div className="flex items-end">
              <button onClick={addBook} disabled={!bookForm.title || loading} className="w-full rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-50">
                {loading ? 'Adding...' : 'Add to Catalog'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            placeholder="Search books by title, author, or category..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 transition shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map(book => (
            <div key={book._id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-violet-200">
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Book size={20} />
                </div>
                <button onClick={() => deleteBook(book._id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{book.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                <User size={12} className="text-slate-400" /> {book.author}
              </p>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {book.category || 'General'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black text-violet-600 uppercase">
                   <BookOpen size={12} /> {book.availableCopies || 0} / {book.totalCopies} Available
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
               <Library size={32} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No books found in catalog</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add a new book above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryManagement;
