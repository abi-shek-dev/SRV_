/**
 * Unified Portal — standalone app
 * Serves both Faculty and Parent login and dashboards.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login }            from './portal/Login';
import { ParentDashboard }  from './portal/ParentDashboard';
import { FacultyDashboard } from './portal/FacultyDashboard';
import { ProtectedRoute }   from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<Login />} />

        {/* Faculty Routes */}
        <Route element={<ProtectedRoute allowedRole="faculty" redirectTo="/login" />}>
          <Route path="/faculty/dashboard"    element={<FacultyDashboard />} />
          <Route path="/faculty/students"     element={<FacultyDashboard section="students" />} />
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

        {/* Parent Routes */}
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
