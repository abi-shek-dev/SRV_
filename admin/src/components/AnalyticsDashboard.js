import { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Users, Wallet, Brain, Clock } from 'lucide-react';
import API_URL from '../config/api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('schoolToken');
    axios.get(`${API_URL}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(err => console.error('[Analytics]', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;
  if (!data) return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">Unable to load analytics.</div>;

  const sortedGrades = Object.keys(data.enrollmentByGrade).sort((a, b) => {
    const numA = parseInt(a); const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const enrollmentChart = {
    labels: sortedGrades,
    datasets: [{
      label: 'Students',
      data: sortedGrades.map(g => data.enrollmentByGrade[g]),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const feeChart = {
    labels: ['Paid', 'Partial', 'Unpaid'],
    datasets: [{
      data: [data.feeCollection.paidCount, data.feeCollection.partialCount, data.feeCollection.unpaidCount],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderWidth: 0
    }]
  };

  const attendanceChart = {
    labels: data.attendanceTrend.map(d => d.date.slice(5)),
    datasets: [{
      label: 'Attendance %',
      data: data.attendanceTrend.map(d => d.percentage),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: 'rgb(99, 102, 241)'
    }]
  };

  const behaviorChart = {
    labels: data.behaviorAverages.map(b => `Grade ${b.grade}`),
    datasets: [{
      label: 'Avg Score',
      data: data.behaviorAverages.map(b => b.average),
      backgroundColor: 'rgba(168, 85, 247, 0.7)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', titleFont: { size: 13 }, bodyFont: { size: 12 }, cornerRadius: 8, padding: 10 } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } } }
  };

  const fc = data.feeCollection;
  const collectionPct = fc.totalFeeAmount > 0 ? Math.round((fc.totalFeePaid / fc.totalFeeAmount) * 100) : 0;

  const summaryCards = [
    { label: 'Total Students', value: Object.values(data.enrollmentByGrade).reduce((a, b) => a + b, 0), icon: Users, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Fee Collection', value: `${collectionPct}%`, icon: Wallet, color: 'bg-amber-100 text-amber-700' },
    { label: 'Avg Attendance', value: data.attendanceTrend.length > 0 ? `${Math.round(data.attendanceTrend.reduce((a, b) => a + b.percentage, 0) / data.attendanceTrend.length)}%` : 'N/A', icon: TrendingUp, color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Pending Leaves', value: data.pendingLeaves, icon: Clock, color: 'bg-rose-100 text-rose-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Enrollment by Grade</h3>
          <div className="h-64"><Bar data={enrollmentChart} options={chartOptions} /></div>
        </div>

        {/* Fee Collection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Fee Collection</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48"><Doughnut data={feeChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } } }, cutout: '65%' }} /></div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">₹{fc.totalFeePaid.toLocaleString()}</span> collected</p>
              <p className="text-sm text-slate-600">of ₹{fc.totalFeeAmount.toLocaleString()} total</p>
              <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${collectionPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Attendance Trend (30 Days)</h3>
          <div className="h-64"><Line data={attendanceChart} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 100 } } }} /></div>
        </div>

        {/* Behavior */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Behavior Average by Grade</h3>
          <div className="h-64"><Bar data={behaviorChart} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 10 } } }} /></div>
        </div>
      </div>
    </div>
  );
}
