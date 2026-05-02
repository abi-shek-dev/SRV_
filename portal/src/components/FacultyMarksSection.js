import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Search, User, CheckCircle2, FileText, Plus, Trash2 } from 'lucide-react';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';

export function FacultyMarksSection() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [term, setTerm] = useState('Quarterly');
  const [marksList, setMarksList] = useState([{ subject: 'English', score: '' }]);
  const [remarks, setRemarks] = useState('');

  const COMMON_SUBJECTS = ['English', 'Language', 'Mathematics', 'Science', 'Social Science', 'Computer Science'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/faculty/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleAddSubject = () => {
    setMarksList([...marksList, { subject: '', score: '' }]);
  };

  const handleRemoveSubject = (index) => {
    const updated = [...marksList];
    updated.splice(index, 1);
    setMarksList(updated);
  };

  const handleMarkChange = (index, field, value) => {
    const updated = [...marksList];
    updated[index][field] = value;
    setMarksList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    // Convert array of {subject, score} to object { "English": 95, "Math": 90 }
    const marksObj = {};
    for (const item of marksList) {
      if (item.subject.trim() && item.score !== '') {
        marksObj[item.subject.trim()] = Number(item.score);
      }
    }

    if (Object.keys(marksObj).length === 0) {
      Swal.fire('Error', 'Please add at least one subject with a score', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/marks`, {
        studentId: selectedStudent._id,
        term,
        marks: marksObj,
        performanceRemarks: remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Marks saved successfully', showConfirmButton: false, timer: 2000 });
      // Reset form
      setSelectedStudent(null);
      setMarksList([{ subject: 'English', score: '' }]);
      setRemarks('');
      setTerm('Quarterly');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save marks', 'error');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.srvNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl relative overflow-hidden">
        <Trophy size={120} className="absolute -bottom-4 -right-4 text-white/10" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Academic Records</p>
          <h2 className="mt-1 text-3xl font-bold">Marks Entry</h2>
          <p className="text-sm text-indigo-50 mt-2 max-w-xl">
            Select a student to enter their term marks. Uploaded marks will immediately reflect on the parent's report card.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side: Student List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User size={18} className="text-indigo-500" /> Class Roster
            </h3>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
              <Search className="text-slate-400 ml-2" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-slate-900"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No students found.</div>
            ) : (
              filteredStudents.map(student => (
                <button
                  key={student._id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                    selectedStudent?._id === student._id 
                      ? 'bg-indigo-50 border border-indigo-200' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedStudent?._id === student._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${selectedStudent?._id === student._id ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {student.name}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">{student.srvNumber}</p>
                  </div>
                  {selectedStudent?._id === student._id && (
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Marks Entry Form */}
        <div>
          {!selectedStudent ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-lg text-slate-500">No Student Selected</p>
              <p className="text-sm mt-2 max-w-xs">Select a student from the roster to start entering their academic marks.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-slate-500 font-semibold">{selectedStudent.srvNumber} • Grade {selectedStudent.grade}-{selectedStudent.section}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Term</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none bg-slate-50"
                  >
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Subject Marks</label>
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Plus size={14} /> Add Subject
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {marksList.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Subject Name"
                            value={item.subject}
                            onChange={(e) => handleMarkChange(index, 'subject', e.target.value)}
                            list="subjects-list"
                            required
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Score"
                          value={item.score}
                          onChange={(e) => handleMarkChange(index, 'score', e.target.value)}
                          required
                          min="0"
                          max="100"
                          className="w-24 rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        {marksList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(index)}
                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <datalist id="subjects-list">
                      {COMMON_SUBJECTS.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Teacher Remarks (Optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add overall comments or performance feedback..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md transition flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Save Marks to Report Card
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
