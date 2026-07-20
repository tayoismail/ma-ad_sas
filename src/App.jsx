import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { useThemeStore } from './store/themeStore';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Landing from './pages/Landing';
import NetworkStatus from './components/NetworkStatus';
import UpdatePrompt from './components/UpdatePrompt';

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminClasses = lazy(() => import('./pages/admin/Classes'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminStudentForm = lazy(() => import('./pages/admin/StudentForm'));
const AdminStudentProfile = lazy(() => import('./pages/admin/StudentProfile'));
const AdminSubjects = lazy(() => import('./pages/admin/Subjects'));
const AdminResults = lazy(() => import('./pages/admin/Results'));
const AdminPromotion = lazy(() => import('./pages/admin/Promotion'));
const AdminTranscript = lazy(() => import('./pages/admin/Transcript'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherMyStudents = lazy(() => import('./pages/teacher/MyStudents'));
const TeacherMyResults = lazy(() => import('./pages/teacher/MyResults'));
const TeacherMyAttendance = lazy(() => import('./pages/teacher/MyAttendance'));
const TeacherMyAssignments = lazy(() => import('./pages/teacher/MyAssignments'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentMyResults = lazy(() => import('./pages/student/MyResults'));
const StudentMyAttendance = lazy(() => import('./pages/student/MyAttendance'));
const BackupPage = lazy(() => import('./pages/admin/Backup'));
const ReportsPage = lazy(() => import('./pages/admin/Reports'));
const UsersPage = lazy(() => import('./pages/admin/Users'));
const AttendancePage = lazy(() => import('./pages/admin/Attendance'));
const AttendanceReportPage = lazy(() => import('./pages/admin/AttendanceReport'));
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'));
const ParentChildrenResults = lazy(() => import('./pages/parent/ChildrenResults'));
const ParentChildrenAttendance = lazy(() => import('./pages/parent/ChildrenAttendance'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLog'));

export default function App() {
  const { init, isLoading, isAuthenticated, updateLastActivity, checkSession, logout } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <NetworkStatus />
      <UpdatePrompt />
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /><p className="text-muted-foreground text-sm animate-pulse">Loading page...</p></div></div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><UsersPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AdminSettings /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AdminClasses /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminStudents /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/students/new" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminStudentForm /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/students/:id" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminStudentProfile /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/students/:id/edit" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminStudentForm /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AdminSubjects /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AttendancePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/attendance/report" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AttendanceReportPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminResults /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/promotion" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><AdminPromotion /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/transcript/:id" element={<ProtectedRoute roles={['admin', 'teacher', 'student']}><ErrorBoundary><AdminTranscript /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'teacher']}><ErrorBoundary><ReportsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/backup" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><BackupPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AuditLogPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher']}><ErrorBoundary><TeacherDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute roles={['teacher']}><ErrorBoundary><TeacherMyStudents /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teacher/results" element={<ProtectedRoute roles={['teacher']}><ErrorBoundary><TeacherMyResults /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute roles={['teacher']}><ErrorBoundary><TeacherMyAttendance /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teacher/assignments" element={<ProtectedRoute roles={['teacher']}><ErrorBoundary><TeacherMyAssignments /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><ErrorBoundary><StudentDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute roles={['student']}><ErrorBoundary><StudentMyResults /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute roles={['student']}><ErrorBoundary><StudentMyAttendance /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/parent/dashboard" element={<ProtectedRoute roles={['parent']}><ErrorBoundary><ParentDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/parent/results" element={<ProtectedRoute roles={['parent']}><ErrorBoundary><ParentChildrenResults /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/parent/attendance" element={<ProtectedRoute roles={['parent']}><ErrorBoundary><ParentChildrenAttendance /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/transcript/:id" element={<ProtectedRoute roles={['student', 'teacher', 'admin']}><ErrorBoundary><AdminTranscript /></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
