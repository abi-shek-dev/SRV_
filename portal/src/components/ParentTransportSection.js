import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bus, MapPin, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import API_URL from '../config/api.js';

export function ParentTransportSection() {
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const token = localStorage.getItem('schoolToken');
        const res = await axios.get(`${API_URL}/api/parent/transport`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransport(res.data);
      } catch (err) {
        console.error(err);
        setError('Error loading transport details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransport();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center">
        <Bus size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-500">Not Assigned to Transport</p>
        <p className="text-sm text-slate-400 mt-1">Your child does not have an active bus route assigned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl relative overflow-hidden">
        <Bus size={120} className="absolute -bottom-4 -right-4 text-white/10" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-50 backdrop-blur">
            <CheckCircle2 size={14} /> Active Route
          </div>
          <h2 className="mt-4 text-3xl font-bold">{transport.routeName}</h2>
          <p className="text-amber-100 font-semibold mt-1 flex items-center gap-2">
            <Bus size={16} /> Bus #{transport.busNumber || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stop Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-500" /> Stop Information
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Stop</p>
              <p className="text-xl font-bold text-slate-900">{transport.stopName || 'Not Assigned'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock size={16} /> <span className="text-xs font-bold uppercase">Pickup Time</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{transport.pickupTime || '--:--'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock size={16} /> <span className="text-xs font-bold uppercase">Drop Time</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{transport.dropTime || '--:--'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Details */}
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
                <p className="font-bold text-slate-900">{transport.driverName || 'Not Assigned'}</p>
                {transport.driverPhone && (
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                    <Phone size={12} /> {transport.driverPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <User size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Helper</p>
                <p className="font-bold text-slate-900">{transport.helperName || 'Not Assigned'}</p>
                {transport.helperPhone && (
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                    <Phone size={12} /> {transport.helperPhone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
