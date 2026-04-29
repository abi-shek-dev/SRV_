/**
 * Parent Portal — standalone app
 * Only serves the Parent login and dashboard.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login }           from './portal/Login';
import { ParentDashboard } from './portal/ParentDashboard';
import { ProtectedRoute }  from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRole="parent" redirectTo="/login" />}>
          <Route path="/parent/dashboard"         element={<ParentDashboard />} />
          <Route path="/parent/academics"         element={<ParentDashboard section="academics" />} />
          <Route path="/parent/attendance"        element={<ParentDashboard section="attendance" />} />
          <Route path="/parent/skills"            element={<ParentDashboard section="skills" />} />
          <Route path="/parent/homework"          element={<ParentDashboard section="homework" />} />
          <Route path="/parent/homework/:subject" element={<ParentDashboard section="homework" />} />
          <Route path="/parent/events"            element={<ParentDashboard section="events" />} />
          <Route path="/parent/polls"             element={<ParentDashboard section="polls" />} />
          <Route path="/parent/feedback"          element={<ParentDashboard section="feedback" />} />
          <Route path="/parent/memories"          element={<ParentDashboard section="memories" />} />
          <Route path="/parent/fees"              element={<ParentDashboard section="fees" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
