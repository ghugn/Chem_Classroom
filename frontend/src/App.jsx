import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Admin Dashboards
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminClasses from './pages/Admin/AdminClasses';
// (Placeholder components for remaining routes)
// const AdminClasses = () => <div className="text-2xl font-bold">Quản lý lớp (Sắp ra mắt)</div>;
import AdminStudents from './pages/Admin/AdminStudents';
import AdminDocuments from './pages/Admin/AdminDocuments';
import AdminTuition from './pages/Admin/AdminTuition';
import AdminSchedule from './pages/Admin/AdminSchedule';
import AdminGrades from './pages/Admin/AdminGrades';

// Student Dashboards
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentDocuments from './pages/Student/StudentDocuments';
import StudentTuition from './pages/Student/StudentTuition';
import StudentGrades from './pages/Student/StudentGrades';

// Shared
import Settings from './pages/Shared/Settings';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="grades" element={<AdminGrades />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="payments" element={<AdminTuition />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="payments" element={<StudentTuition />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
