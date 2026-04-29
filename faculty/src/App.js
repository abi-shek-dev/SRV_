/**
 * Faculty Portal — standalone app
 * Only serves the Faculty login and dashboard.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login }            from './portal/Login';
import { FacultyDashboard } from './portal/FacultyDashboard';
import { ProtectedRoute }   from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<Login />} />

        <Route element={<ProtectedRoute allowedRole="faculty" redirectTo="/login" />}>
          <Route path="/faculty/dashboard"    element={<FacultyDashboard />} />
          <Route path="/faculty/homework"     element={<FacultyDashboard section="homework" />} />
          <Route path="/faculty/attendance"   element={<FacultyDashboard section="attendance" />} />
          <Route path="/faculty/behavior"     element={<FacultyDashboard section="behavior" />} />
          <Route path="/faculty/announcements" element={<FacultyDashboard section="announcements" />} />
          <Route path="/faculty/memories"     element={<FacultyDashboard section="memories" />} />
          <Route path="/faculty/events"       element={<FacultyDashboard section="events" />} />
          <Route path="/faculty/polls"        element={<FacultyDashboard section="polls" />} />
          <Route path="/faculty/feedback"     element={<FacultyDashboard section="feedback" />} />
          <Route path="/faculty/mytasks"      element={<FacultyDashboard section="mytasks" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
