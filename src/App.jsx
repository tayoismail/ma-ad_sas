import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { useThemeStore } from './store/themeStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Landing from './pages/Landing';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSettings from './pages/admin/Settings';
import AdminClasses from './pages/admin/Classes';
import AdminStudents from './pages/admin/Students';
import AdminStudentForm from './pages/admin/StudentForm';
import AdminStudentProfile from './pages/admin/StudentProfile';
import AdminSubjects from './pages/admin/Subjects';
import AdminResults from './pages/admin/Results';
import AdminPromotion from './pages/admin/Promotion';
import AdminTranscript from './pages/admin/Transcript';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import BackupPage from './pages/admin/Backup';
import ReportsPage from './pages/admin/Reports';
import UsersPage from './pages/admin/Users';
import AttendancePage from './pages/admin/Attendance';
import AttendanceReportPage from './pages/admin/AttendanceReport';
import ParentDashboard from './pages/parent/Dashboard';

export default function App() {
  const { init, seedAccounts, isLoading, isAuthenticated, updateLastActivity, checkSession, logout } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    seedAccounts();
    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const ok = checkSession();
      if (!ok) {
        logout();
        window.location.href = '/login';
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleActivity = () => updateLastActivity();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-secondary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/60 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><AdminClasses /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/students/new" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminStudentForm /></ProtectedRoute>} />
        <Route path="/admin/students/:id" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminStudentProfile /></ProtectedRoute>} />
        <Route path="/admin/students/:id/edit" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminStudentForm /></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute roles={['admin']}><AdminSubjects /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin', 'teacher']}><AttendancePage /></ProtectedRoute>} />
        <Route path="/admin/attendance/report" element={<ProtectedRoute roles={['admin', 'teacher']}><AttendanceReportPage /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminResults /></ProtectedRoute>} />
        <Route path="/admin/promotion" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminPromotion /></ProtectedRoute>} />
        <Route path="/admin/transcript/:id" element={<ProtectedRoute roles={['admin', 'teacher', 'student']}><AdminTranscript /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'teacher']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/backup" element={<ProtectedRoute roles={['admin']}><BackupPage /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/parent/dashboard" element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="/transcript/:id" element={<ProtectedRoute roles={['student', 'teacher', 'admin']}><AdminTranscript /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
