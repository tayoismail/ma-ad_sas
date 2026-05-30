import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, GraduationCap, School, BookMarked, CalendarDays,
  Award, Printer, TrendingUp, Database, Settings, LayoutDashboard, LogOut
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from './ui/button';

const allLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, adminPath: '/admin/dashboard', teacherPath: '/teacher/dashboard' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Students', icon: GraduationCap, path: '/admin/students' },
  { label: 'Classes', icon: School, path: '/admin/classes' },
  { label: 'Subjects', icon: BookMarked, path: '/admin/subjects' },
  { label: 'Attendance', icon: CalendarDays, path: '/admin/attendance' },
  { label: 'Results', icon: Award, path: '/admin/results' },
  { label: 'Reports', icon: Printer, path: '/admin/reports' },
  { label: 'Promotion', icon: TrendingUp, path: '/admin/promotion' },
  { label: 'Backup', icon: Database, path: '/admin/backup' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const teacherLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'My Students', icon: GraduationCap, path: '/teacher/students' },
  { label: 'My Results', icon: Award, path: '/teacher/results' },
  { label: 'Attendance', icon: CalendarDays, path: '/teacher/attendance' },
  { label: 'Promotion', icon: TrendingUp, path: '/admin/promotion' },
];

export default function AdminSidebar({ activePath, sidebarOpen, setSidebarOpen, className = '' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isTeacher = user?.role === 'teacher';
  const links = isTeacher ? teacherLinks : allLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (link) => {
    const path = link.path || link.adminPath;
    return activePath === path;
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-card/80 backdrop-blur-xl border-r border-border shadow-2xl shadow-black/5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`}>
        <div className="flex flex-col h-full">
          <button onClick={() => navigate('/')} className="p-6 border-b border-border w-full text-left hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-card-foreground">MA'AD AHLIL AATHAR</p>
                <p className="text-[10px] text-muted-foreground">Assessment System</p>
              </div>
            </div>
          </button>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const path = link.path || (isTeacher ? link.teacherPath : link.adminPath);
              const active = isActive(link);
              return (
                <button
                  key={link.label}
                  onClick={() => {
                    navigate(path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-gray-100/50'
                  }`}
                >
                  <link.icon className="w-4 h-4" /> {link.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50/50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" /> Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
