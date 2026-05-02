import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Trash2, X, ChevronDown, Bus, Users as UsersIcon, MapPin, Clock, Plus } from 'lucide-react';
import { API_URL } from '../config/api.js';

const TransportManagement = ({ allStudents }) => {
  const [routes, setRoutes] = useState([]);
  const [routeForm, setRouteForm] = useState({ routeName: '', busNumber: '', driverName: '', driverPhone: '', helperName: '', helperPhone: '' });
  const [routeStops, setRouteStops] = useState([{ stopName: '', pickupTime: '', dropTime: '' }]);
  const [tLoading, setTLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', stopId: '' });

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/admin/transport/routes`, { headers: { Authorization: `Bearer ${token}` } });
      setRoutes(res.data);
    } catch (err) {}
  };

  const createRoute = async () => {
    if (!routeForm.routeName) return;
    setTLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const stops = routeStops.filter(s => s.stopName.trim());
      await axios.post(`${API_URL}/api/admin/transport/routes`, { ...routeForm, stops }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Route created!', showConfirmButton: false, timer: 2000 });
      setRouteForm({ routeName: '', busNumber: '', driverName: '', driverPhone: '', helperName: '', helperPhone: '' });
      setRouteStops([{ stopName: '', pickupTime: '', dropTime: '' }]);
      loadRoutes();
    } catch (err) { Swal.fire('Error', 'Failed to create route', 'error'); }
    finally { setTLoading(false); }
  };

  const deleteRoute = async (id) => {
    const r = await Swal.fire({ title: 'Deactivate route?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!r.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/transport/routes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadRoutes();
    } catch (err) {}
  };

  const assignStudent = async () => {
    if (!assignForm.studentId || !assignForm.routeId) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/admin/transport/assign`, assignForm, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Student assigned!', showConfirmButton: false, timer: 2000 });
      setAssignForm({ studentId: '', routeId: '', stopId: '' });
      loadRoutes();
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Assignment failed', 'error'); }
  };

  const updateStop = (idx, field, value) => setRouteStops(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const fieldCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition placeholder:font-normal placeholder:text-slate-400";
  const selectCls = `${fieldCls} appearance-none cursor-pointer`;
  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-600 to-cyan-500">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Bus size={18} color="white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">Add New Route</h3>
            <p className="text-xs text-sky-100">Create a bus route with stops and driver info</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Route Information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>Route Name <span className="text-red-400">*</span></label>
                <input placeholder="e.g. Anna Nagar Route" value={routeForm.routeName} onChange={e => setRouteForm(f => ({ ...f, routeName: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Bus Number</label>
                <input placeholder="e.g. TN-01-AB-1234" value={routeForm.busNumber} onChange={e => setRouteForm(f => ({ ...f, busNumber: e.target.value }))} className={fieldCls} />
              </div>
              <div className="hidden lg:block" />
              <div>
                <label className={labelCls}>Driver Name</label>
                <input placeholder="e.g. Rajan Kumar" value={routeForm.driverName} onChange={e => setRouteForm(f => ({ ...f, driverName: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Driver Phone</label>
                <input placeholder="e.g. 9876543210" value={routeForm.driverPhone} onChange={e => setRouteForm(f => ({ ...f, driverPhone: e.target.value }))} className={fieldCls} />
              </div>
              <div className="hidden lg:block" />
              <div>
                <label className={labelCls}>Helper Name</label>
                <input placeholder="e.g. Murugan" value={routeForm.helperName} onChange={e => setRouteForm(f => ({ ...f, helperName: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Helper Phone</label>
                <input placeholder="e.g. 9123456789" value={routeForm.helperPhone} onChange={e => setRouteForm(f => ({ ...f, helperPhone: e.target.value }))} className={fieldCls} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Bus Stops</p>
              <button
                onClick={() => setRouteStops(prev => [...prev, { stopName: '', pickupTime: '', dropTime: '' }])}
                className="flex items-center gap-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 text-xs font-bold text-sky-600 transition"
              >
                <Plus size={12} /> Add Stop
              </button>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[1fr_140px_140px_36px] gap-2 mb-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stop Name</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pickup Time</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Drop Time</span>
              <span />
            </div>

            <div className="space-y-2">
              {routeStops.map((stop, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_140px_36px] items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    placeholder="e.g. Anna Nagar Bus Stop"
                    value={stop.stopName}
                    onChange={e => updateStop(i, 'stopName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
                  />
                  <input
                    type="time"
                    value={stop.pickupTime}
                    onChange={e => updateStop(i, 'pickupTime', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
                  />
                  <input
                    type="time"
                    value={stop.dropTime}
                    onChange={e => updateStop(i, 'dropTime', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
                  />
                  {routeStops.length > 1 && (
                    <button onClick={() => setRouteStops(prev => prev.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 hover:text-red-600 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={createRoute}
              disabled={!routeForm.routeName || tLoading}
              className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200 transition-all disabled:opacity-50"
            >
              {tLoading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <UsersIcon size={17} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Assign Student to Route</h3>
            <p className="text-xs text-slate-400">Link a student to a bus route and stop</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Student</label>
              <div className="relative">
                <select value={assignForm.studentId} onChange={e => setAssignForm(f => ({ ...f, studentId: e.target.value }))} className={selectCls}>
                  <option value="">Select Student</option>
                  {allStudents.map(s => <option key={s._id} value={s._id}>{s.name} ({s.srvNumber})</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Route</label>
              <div className="relative">
                <select value={assignForm.routeId} onChange={e => setAssignForm(f => ({ ...f, routeId: e.target.value, stopId: '' }))} className={selectCls}>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r._id} value={r._id}>{r.routeName}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              </div>
            </div>
            {assignForm.routeId && (() => {
              const r = routes.find(rt => String(rt._id) === String(assignForm.routeId));
              return r?.stops?.length ? (
                <div>
                  <label className={labelCls}>Stop</label>
                  <div className="relative">
                    <select value={assignForm.stopId} onChange={e => setAssignForm(f => ({ ...f, stopId: e.target.value }))} className={selectCls}>
                      <option value="">Select Stop</option>
                      {r.stops.map(s => <option key={s._id} value={s._id}>{s.stopName}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </div>
                </div>
              ) : null;
            })()}
            <div className="flex items-end">
              <button
                onClick={assignStudent}
                disabled={!assignForm.studentId || !assignForm.routeId}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {routes.map(route => (
          <div key={route._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">{route.routeName}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><Bus size={12}/> {route.busNumber || 'N/A'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><UsersIcon size={12}/> {route.driverName || 'N/A'} ({route.driverPhone || '-'})</p>
                </div>
              </div>
              <button onClick={() => deleteRoute(route._id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
            {route.stops?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {route.stops.map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100 flex items-center gap-1.5">
                    <MapPin size={10} /> {s.stopName} <Clock size={10} className="ml-0.5 opacity-60" /> {s.pickupTime || '-'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportManagement;
