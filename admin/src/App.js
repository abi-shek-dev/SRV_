/**
 * Admin Portal — Admin-only routes
 * Faculty and Parent portals are separate apps in /faculty and /parent directories.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AdminLogin }      from './portal/AdminLogin';
import { AdminDashboard }  from './portal/AdminDashboard';
import { FacultyProgress } from './portal/FacultyProgress';
import { EnquiryPage }     from './portal/EnquiryPage';
import { NotFound }        from './portal/NotFound';

import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Root redirects to admin login */}
        <Route path="/"               element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login"    element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" redirectTo="/admin-login" />}>
          <Route path="/admin/dashboard"        element={<AdminDashboard />} />
          <Route path="/admin/faculty"           element={<AdminDashboard section="faculty" />} />
          <Route path="/admin/students"          element={<AdminDashboard section="students" />} />
          <Route path="/admin/promote"           element={<AdminDashboard section="promote" />} />
          <Route path="/admin/memories"          element={<AdminDashboard section="memories" />} />
          <Route path="/admin/events"            element={<AdminDashboard section="events" />} />
          <Route path="/admin/polls"             element={<AdminDashboard section="polls" />} />
          <Route path="/admin/feedback"          element={<AdminDashboard section="feedback" />} />
          <Route path="/admin/cafeteria"         element={<AdminDashboard section="cafeteria" />} />
          <Route path="/admin/announcements"     element={<AdminDashboard section="announcements" />} />
          <Route path="/admin/faculty-progress"  element={<FacultyProgress />} />
          <Route path="/admin/enquiry"           element={<EnquiryPage />} />
          <Route path="/admin/leave-requests"    element={<AdminDashboard section="leave-requests" />} />
          <Route path="/admin/analytics"         element={<AdminDashboard section="analytics" />} />
          <Route path="/admin/exports"           element={<AdminDashboard section="exports" />} />
          <Route path="/admin/timetable"         element={<AdminDashboard section="timetable" />} />
          <Route path="/admin/report-card"       element={<AdminDashboard section="report-card" />} />
          <Route path="/admin/promotion"         element={<AdminDashboard section="promotion" />} />
          <Route path="/admin/circulars"         element={<AdminDashboard section="circulars" />} />
          <Route path="/admin/transport"         element={<AdminDashboard section="transport" />} />
          <Route path="/admin/library"           element={<AdminDashboard section="library" />} />
          <Route path="/admin/fees"              element={<AdminDashboard section="fees" />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
