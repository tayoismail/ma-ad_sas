import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Calendar, School,
  Pencil, Menu, Hash, FileText, AlertCircle, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useStudentsStore from '../../store/studentsStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import AdminSidebar from '../../components/AdminSidebar';

export default function StudentProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { getStudent } = useStudentsStore();
  const [student, setStudent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getStudent(id)
      .then((s) => { if (!cancelled) { setStudent(s); setLoading(false); if (!s) setError('Student not found'); } })
      .catch((err) => { if (!cancelled) { setError(err.message || 'Failed to load student'); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-secondary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-300 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'The student you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/admin/students')}>Go to Students List</Button>
        </Card>
      </div>
    );
  }

  const infoCards = [
    { icon: Hash, label: 'Student ID', value: student.studentId || '--' },
    { icon: Calendar, label: 'Date of Birth', value: student.dateOfBirth || '--' },
    { icon: User, label: 'Sex', value: student.sex || '--' },
    { icon: School, label: 'Class', value: student.className || '--' },
    { icon: Calendar, label: 'Enrolled', value: student.enrollmentDate || '--' },
    { icon: User, label: 'Parent', value: student.parentName || '--' },
    { icon: Phone, label: 'Parent Phone', value: student.parentPhone || '--' },
    { icon: Mail, label: 'Parent Email', value: student.parentEmail || '--' },
  ];

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/students" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/admin/students')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-card-foreground">Student Profile</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/transcript/${id}`)} className="mr-2">
                <FileText className="w-4 h-4 mr-1" /> View Transcript
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/students/${id}/edit`)}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          <div className="animate-fade-in">
            <Card className="p-6 lg:p-8 bg-card border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{student.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <School className="w-3 h-3" /> {student.className}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <Hash className="w-3 h-3" /> {student.studentId || 'No ID'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {infoCards.map((card) => (
              <Card key={card.label} className="p-4 bg-card border-border hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100/50">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{card.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
