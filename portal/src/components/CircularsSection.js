import { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, ExternalLink, Calendar, Search } from 'lucide-react';
import API_URL from '../config/api.js';

export function CircularsSection({ role }) {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        // Both parent and faculty routes match the pattern
        const endpoint = role === 'parent' ? '/api/parent/circulars' : '/api/faculty/circulars';
        const res = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCirculars(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCirculars();
  }, [role]);

  const filteredCirculars = circulars.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 text-white shadow-xl relative overflow-hidden">
        <Megaphone size={120} className="absolute -bottom-4 -right-4 text-white/10" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-100">Official Communication</p>
          <h2 className="mt-1 text-3xl font-bold">Circulars & Notices</h2>
          <p className="text-sm text-cyan-50 mt-2 max-w-xl">
            Stay updated with the latest announcements, policy changes, and official documents from the school administration.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <Search className="text-slate-400 ml-2" size={20} />
        <input
          type="text"
          placeholder="Search circulars by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-900"
        />
      </div>

      {filteredCirculars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-500">
          <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold">No Circulars Found</p>
          <p className="text-sm mt-1">There are no official notices matching your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCirculars.map(circular => (
            <div key={circular._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800">
                      <Megaphone size={10} /> Official Notice
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Calendar size={12} /> {new Date(circular.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                    {circular.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {circular.description}
                  </p>
                </div>
                {circular.fileUrl && (
                  <a
                    href={circular.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200 transition-all"
                    title="View Attached Document"
                  >
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
