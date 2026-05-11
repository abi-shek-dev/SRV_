import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, IndianRupee, TrendingUp, AlertCircle, Search, Printer, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import srvLogo from '../assets/fav_logo/srv-t.png';

export function FeeManagementSection({ allStudents = [], onRefresh }) {
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState({ grade: '', section: '', status: '', search: '' });
  const [feeStudent, setFeeStudent] = useState(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;
  const token = localStorage.getItem('schoolToken');

  useEffect(() => {
    axios.get(`${API_URL}/api/admin/fee-summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSummary(r.data)).catch(() => {});
  }, [allStudents]);

  const filterKey = `${filter.grade}|${filter.section}|${filter.status}|${filter.search}`;
  useEffect(() => { setPage(0); }, [filterKey]);

  const filtered = useMemo(() => allStudents.filter(s => {
    if (filter.grade && s.grade !== filter.grade) return false;
    if (filter.section && s.section !== filter.section) return false;
    if (filter.status) {
      const ov = s.fees?.overall || 'Unpaid';
      if (filter.status !== ov) return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !(s.srvNumber || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allStudents, filter.grade, filter.section, filter.status, filter.search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [filtered, page]);

  const statusBadge = (v) => {
    if (v === 'Paid') return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>;
    if (v === 'Partial') return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Partial</span>;
    return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">Unpaid</span>;
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  const printReceipt = async (student) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    const f = student.fees || {};
    const pw = 210, margin = 20, cw = pw - 2 * margin;

    // Draw logo inside a branded circle (like the website)
    const logoCx = margin + 14, logoCy = 24, logoR = 14;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = srvLogo; });
      // Outer green circle
      doc.setFillColor(10, 106, 88); doc.circle(logoCx, logoCy, logoR, 'F');
      // Inner white circle
      doc.setFillColor(255, 255, 255); doc.circle(logoCx, logoCy, logoR - 1.5, 'F');
      // Logo image clipped inside the circle
      doc.addImage(img, 'PNG', logoCx - 9, logoCy - 9, 18, 18);
    } catch {}

    // Header — positioned to the right of the circle logo
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('SRV MATRICULATION SCHOOL', pw / 2 + 10, 20, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Tirupattur, Tamil Nadu', pw / 2 + 10, 26, { align: 'center' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', pw / 2 + 10, 36, { align: 'center' });
    doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.8);
    doc.line(margin, 40, pw - margin, 40);

    // Receipt info — receipt number uses student SRV number
    let y = 48;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const seq = String(Date.now()).slice(-4);
    const receiptNo = `${student.srvNumber}-${seq}`;
    doc.text(`Receipt No: ${receiptNo}`, margin, y);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pw - margin, y, { align: 'right' });

    // Student details
    y += 12;
    doc.setFillColor(248, 250, 252); doc.roundedRect(margin, y - 5, cw, 32, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Student Details', margin + 5, y + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Name: ${student.name}`, margin + 5, y + 10);
    doc.text(`SRV Number: ${student.srvNumber}`, pw / 2, y + 10);
    doc.text(`Grade: ${student.grade} - Section: ${student.section}`, margin + 5, y + 18);
    const parentName = student.fatherName ? `Father: ${student.fatherName}` : student.motherName ? `Mother: ${student.motherName}` : student.guardianName ? `Guardian: ${student.guardianName}` : '';
    if (parentName) doc.text(parentName, pw / 2, y + 18);

    // Fee table
    y += 40;
    const cols = [margin, margin + 55, margin + 95, margin + 130, margin + cw];
    const headers = ['Description', 'Total Due', 'Amount Paid', 'Remaining', 'Status'];

    doc.setFillColor(15, 23, 42); doc.rect(margin, y, cw, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    headers.forEach((h, i) => doc.text(h, cols[i] + 3, y + 7));
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');

    const rows = [
      ['Term 1 Fees', f.term1Amount || 4500, f.term1Paid || 0, f.term1 || 'Unpaid'],
      ['Term 2 Fees', f.term2Amount || 4500, f.term2Paid || 0, f.term2 || 'Unpaid'],
      ['Term 3 Fees', f.term3Amount || 4500, f.term3Paid || 0, f.term3 || 'Unpaid'],
      ['Additional Fees', f.additionalFees || 0, f.additionalPaid || 0, (f.additionalPaid || 0) >= (f.additionalFees || 0) && (f.additionalFees || 0) > 0 ? 'Paid' : (f.additionalPaid || 0) > 0 ? 'Partial' : 'Unpaid'],
    ];

    y += 10;
    rows.forEach((row, idx) => {
      const ry = y + idx * 10;
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, ry, cw, 10, 'F'); }
      const due = Number(row[1]);
      const paid = Number(row[2]);
      const rem = due - paid;
      doc.text(row[0], cols[0] + 3, ry + 7);
      doc.text(fmt(due), cols[1] + 3, ry + 7);
      doc.setTextColor(16, 185, 129); doc.text(fmt(paid), cols[2] + 3, ry + 7); doc.setTextColor(0, 0, 0);
      doc.setTextColor(239, 68, 68); doc.text(fmt(rem), cols[3] + 3, ry + 7); doc.setTextColor(0, 0, 0);
      doc.text(row[3], cols[4] - 15, ry + 7);
    });

    // Totals
    y += rows.length * 10 + 4;
    doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y);
    y += 8;
    const totalDue = rows.reduce((s, r) => s + Number(r[1]), 0);
    const totalPaid = rows.reduce((s, r) => s + Number(r[2]), 0);
    const totalRem = totalDue - totalPaid;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Grand Total:', margin + 3, y + 2);
    doc.text(`Due: ${fmt(totalDue)}`, margin + 55, y + 2);
    doc.setTextColor(16, 185, 129); doc.text(`Paid: ${fmt(totalPaid)}`, margin + 100, y + 2); doc.setTextColor(0, 0, 0);
    doc.setTextColor(239, 68, 68); doc.text(`Remaining: ${fmt(totalRem)}`, margin + 145, y + 2); doc.setTextColor(0, 0, 0);

    // Overall status
    y += 12;
    const ov = f.overall || 'Unpaid';
    doc.setFillColor(ov === 'Paid' ? 220 : ov === 'Partial' ? 254 : 254, ov === 'Paid' ? 252 : ov === 'Partial' ? 243 : 226, ov === 'Paid' ? 231 : ov === 'Partial' ? 199 : 226);
    doc.roundedRect(margin, y, cw, 14, 3, 3, 'F');
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`Overall Fee Status: ${ov.toUpperCase()}`, pw / 2, y + 9, { align: 'center' });

    // Footer
    y += 30;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 50, y);
    doc.line(pw - margin - 50, y, pw - margin, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text("Admin Signature", margin + 5, y + 5);
    doc.text("Parent Signature", pw - margin - 45, y + 5);

    y += 20;
    doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.3); doc.line(margin, y, pw - margin, y);
    y += 6;
    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text('This is a computer-generated receipt from SRV Matriculation School ERP System.', pw / 2, y, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | Receipt #${receiptNo}`, pw / 2, y + 4, { align: 'center' });

    doc.save(`Fee_Receipt_${student.srvNumber}_${student.name.replace(/\s/g, '_')}.pdf`);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Receipt downloaded!', showConfirmButton: false, timer: 2000 });
  };

  const GRADES = ['Pre KG','LKG','UKG','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

  const cards = summary ? [
    { label: 'Total Students', value: summary.totalStudents, icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { label: 'Total Collected', value: fmt(summary.totalCollected), icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: 'Total Pending', value: fmt(summary.totalPending), icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-200' },
    { label: 'Collection Rate', value: `${summary.collectionRate}%`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`rounded-2xl border p-3 sm:p-5 ${c.color}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/80"><Icon size={18} /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70 truncate">{c.label}</p>
                    <p className="text-base sm:text-xl font-display font-bold truncate">{c.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search by name or SRV number..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={filter.grade} onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm outline-none">
            <option value="">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filter.section} onChange={e => setFilter(f => ({ ...f, section: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm outline-none">
            <option value="">All Sections</option>
            {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm outline-none">
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-400">{filtered.length} student(s) found</p>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">No students match your filters.</div>
        )}
        {paginated.map(s => {
          const f = s.fees || {};
          return (
            <div key={s._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.srvNumber} · {s.grade}-{s.section}</p>
                </div>
                {statusBadge(f.overall || 'Unpaid')}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Term 1</p>
                  {statusBadge(f.term1 || 'Unpaid')}
                  <p className="text-[10px] text-slate-500 mt-1">{fmt(f.term1Paid)}/{fmt(f.term1Amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Term 2</p>
                  {statusBadge(f.term2 || 'Unpaid')}
                  <p className="text-[10px] text-slate-500 mt-1">{fmt(f.term2Paid)}/{fmt(f.term2Amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Term 3</p>
                  {statusBadge(f.term3 || 'Unpaid')}
                  <p className="text-[10px] text-slate-500 mt-1">{fmt(f.term3Paid)}/{fmt(f.term3Amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setFeeStudent(s)} className="flex-1 rounded-lg bg-emerald-50 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 active:bg-emerald-100">
                  <IndianRupee size={12} className="inline -mt-0.5 mr-0.5" />Record Payment
                </button>
                <button onClick={() => printReceipt(s)} className="flex-1 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-600 border border-slate-200 active:bg-slate-200">
                  <Printer size={12} className="inline -mt-0.5 mr-0.5" />Receipt
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white text-xs">
              <tr>
                <th className="p-3 font-bold">Student</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Term 1</th>
                <th className="p-3">Term 2</th>
                <th className="p-3">Term 3</th>
                <th className="p-3">Additional</th>
                <th className="p-3">Overall</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">No students match your filters.</td></tr>
              )}
              {paginated.map(s => {
                const f = s.fees || {};
                return (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.srvNumber}</p>
                    </td>
                    <td className="p-3 text-slate-600">{s.grade}-{s.section}</td>
                    <td className="p-3">
                      {statusBadge(f.term1 || 'Unpaid')}
                      <p className="text-[10px] text-slate-400 mt-1">{fmt(f.term1Paid)}/{fmt(f.term1Amount)}</p>
                    </td>
                    <td className="p-3">
                      {statusBadge(f.term2 || 'Unpaid')}
                      <p className="text-[10px] text-slate-400 mt-1">{fmt(f.term2Paid)}/{fmt(f.term2Amount)}</p>
                    </td>
                    <td className="p-3">
                      {statusBadge(f.term3 || 'Unpaid')}
                      <p className="text-[10px] text-slate-400 mt-1">{fmt(f.term3Paid)}/{fmt(f.term3Amount)}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-semibold text-slate-700">{fmt(f.additionalPaid)}/{fmt(f.additionalFees)}</p>
                    </td>
                    <td className="p-3">{statusBadge(f.overall || 'Unpaid')}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setFeeStudent(s)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200">
                          <IndianRupee size={12} className="inline -mt-0.5 mr-0.5" />Record
                        </button>
                        <button onClick={() => printReceipt(s)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition border border-slate-200">
                          <Printer size={12} className="inline -mt-0.5 mr-0.5" />Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
          <p className="text-[10px] sm:text-xs text-slate-500">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {feeStudent && (
        <FeeModal student={feeStudent} onClose={() => setFeeStudent(null)} onUpdate={() => { setFeeStudent(null); if (onRefresh) onRefresh(); }} />
      )}
    </div>
  );
}

function FeeModal({ student, onClose, onUpdate }) {
  const [fees, setFees] = useState({
    term1: student.fees?.term1 || 'Unpaid', term1Amount: student.fees?.term1Amount || 4500, term1Paid: student.fees?.term1Paid || 0,
    term2: student.fees?.term2 || 'Unpaid', term2Amount: student.fees?.term2Amount || 4500, term2Paid: student.fees?.term2Paid || 0,
    term3: student.fees?.term3 || 'Unpaid', term3Amount: student.fees?.term3Amount || 4500, term3Paid: student.fees?.term3Paid || 0,
    overall: student.fees?.overall || 'Unpaid', additionalFees: student.fees?.additionalFees || 0, additionalPaid: student.fees?.additionalPaid || 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${API_URL}/api/admin/student/${student._id}/fees`, fees, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Fees updated!', showConfirmButton: false, timer: 2000 });
      onUpdate();
    } catch { Swal.fire('Error', 'Failed to save fees', 'error'); }
    finally { setSaving(false); }
  };

  const Row = ({ label, termKey }) => (
    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-sm text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
          <input type="number" value={fees[termKey + 'Amount']} onChange={e => setFees(f => ({ ...f, [termKey + 'Amount']: e.target.value }))}
            className="w-20 pl-5 pr-1 py-1.5 text-xs font-bold border border-slate-300 rounded-lg outline-none" />
        </div>
        <span className="text-slate-400 text-[10px] font-bold">Paid:</span>
        <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">₹</span>
          <input type="number" value={fees[termKey + 'Paid']} onChange={e => setFees(f => ({ ...f, [termKey + 'Paid']: e.target.value }))}
            className="w-20 pl-5 pr-1 py-1.5 text-xs font-bold border border-emerald-300 rounded-lg outline-none text-emerald-700 bg-emerald-50" />
        </div>
        <select value={fees[termKey]} onChange={e => setFees(f => ({ ...f, [termKey]: e.target.value }))}
          className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border-2 w-20 outline-none ${fees[termKey] === 'Paid' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : fees[termKey] === 'Partial' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-300 text-slate-600'}`}>
          <option value="Unpaid">Unpaid</option><option value="Partial">Partial</option><option value="Paid">Paid</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center">
      <div className="mx-auto my-3 w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
          <div><h2 className="text-xl font-bold font-display">Record Payment</h2><p className="text-sm text-slate-300">{student.name} ({student.srvNumber})</p></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5">
          <Row label="Term 1" termKey="term1" /><Row label="Term 2" termKey="term2" /><Row label="Term 3" termKey="term3" />
          <div className="pt-3 border-t border-slate-100 mt-2">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-sm text-slate-700">Overall Status</span>
              <select value={fees.overall} onChange={e => setFees(f => ({ ...f, overall: e.target.value }))}
                className={`text-xs font-bold px-3 py-2 rounded-lg border-2 w-28 outline-none ${fees.overall === 'Paid' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : fees.overall === 'Partial' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-300 text-slate-600'}`}>
                <option value="Unpaid">Unpaid</option><option value="Partial">Partial</option><option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 mt-3">
            <label className="block font-semibold text-sm text-slate-700 mb-2">Additional Fees</label>
            <div className="flex gap-3">
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input type="number" value={fees.additionalFees} onChange={e => setFees(f => ({ ...f, additionalFees: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" placeholder="Total" />
              </div>
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">₹</span>
                <input type="number" value={fees.additionalPaid} onChange={e => setFees(f => ({ ...f, additionalPaid: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border border-emerald-300 rounded-xl outline-none font-bold text-emerald-700 bg-emerald-50" placeholder="Paid" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 p-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="w-full rounded-xl px-5 py-2 font-bold text-slate-600 hover:bg-slate-200 sm:w-auto">Cancel</button>
          <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto">
            <CheckCircle2 size={18} /> {saving ? 'Saving...' : 'Save Fees'}
          </button>
        </div>
      </div>
    </div>
  );
}
