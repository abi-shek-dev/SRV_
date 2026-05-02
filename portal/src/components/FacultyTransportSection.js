import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bus, MapPin, User, Search, Phone, Clock, CheckCircle2 } from 'lucide-react';
import API_URL from '../config/api.js';

export function FacultyTransportSection() {
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'roster'
  
  // Personal Transport State
  const [myTransport, setMyTransport] = useState(null);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  
  // Roster Transport State
  const [records, setRecords] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPersonalTransport = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/faculty/my-transport`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyTransport(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPersonal(false);
      }
    };
    
    const fetchRosterTransport = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/faculty/transport`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchPersonalTransport();
    fetchRosterTransport();
  }, []);

  const filteredRecords = records.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.srvNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.routeName && r.routeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            activeTab === 'personal'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          My Transport
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Class Roster
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingPersonal ? (
             <div className="flex justify-center py-20">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
             </div>
          ) : !myTransport ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center">
              <Bus size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-500">Not Assigned to Transport</p>
              <p className="text-sm text-slate-400 mt-1">You do not have an active bus route assigned.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl relative overflow-hidden">
                <Bus size={120} className="absolute -bottom-4 -right-4 text-white/10" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-50 backdrop-blur">
                    <CheckCircle2 size={14} /> Active Route
                  </div>
                  <h2 className="mt-4 text-3xl font-bold">{myTransport.routeName}</h2>
                  <p className="text-amber-100 font-semibold mt-1 flex items-center gap-2">
                    <Bus size={16} /> Bus #{myTransport.busNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" /> Stop Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Stop</p>
                      <p className="text-xl font-bold text-slate-900">{myTransport.stopName || 'Not Assigned'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <Clock size={16} /> <span className="text-xs font-bold uppercase">Pickup Time</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{myTransport.pickupTime || '--:--'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <Clock size={16} /> <span className="text-xs font-bold uppercase">Drop Time</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{myTransport.dropTime || '--:--'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                    <User size={16} className="text-blue-500" /> Transport Crew
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver</p>
                        <p className="font-bold text-slate-900">{myTransport.driverName || 'Not Assigned'}</p>
                        {myTransport.driverPhone && (
                          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                            <Phone size={12} /> {myTransport.driverPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <Search className="text-slate-400 ml-2" size={20} />
            <input
              type="text"
              placeholder="Search by student name, SRV number, or route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900"
            />
          </div>

          {loadingRoster ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-500">
              <Bus size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold">No transport records found</p>
              <p className="text-sm mt-1">None of the students in your class are assigned to a bus route.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map(record => (
                <div key={record.studentId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{record.studentName}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{record.srvNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Route</p>
                      <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                        <Bus size={14} className="text-amber-500" />
                        {record.routeName} (Bus #{record.busNumber})
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stop</p>
                      <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                        <MapPin size={14} className="text-emerald-500" />
                        {record.stopName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-6">
                        {record.pickupTime} Pickup • {record.dropTime} Drop
                      </div>
                    </div>

                    {record.driverName && (
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver</p>
                         <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                            <Phone size={14} className="text-blue-500" />
                            {record.driverName} ({record.driverPhone})
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
