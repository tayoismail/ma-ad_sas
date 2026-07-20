import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, LogOut, ClipboardList, School, TrendingUp, Moon, Sun, AlertCircle, CalendarDays, ArrowLeft, Menu, ClipboardCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useSubjectsStore from '../../store/subjectsStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import useSettingsStore from '../../store/settingsStore';
import { semesterLabel } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import AdminSidebar from '../../components/AdminSidebar';

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { classes, loadClasses, loading: classesLoading } = useClassesStore();
  const { subjects, loadSubjects, loading: subjectsLoading } = useSubjectsStore();
  const { students, loadStudents, loading: studentsLoading } = useStudentsStore();
  const { results, loadResults, loading: resultsLoading } = useResultsStore();
  const { settings, loadSettings, loading: settingsLoading } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadSubjects();
    loadStudents();
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherSubjects = user?.teacherSubjects || [];
  const teacherSubjectSet = new Set(teacherSubjects);
  const assignedSubjectList = subjects.filter((s) => teacherSubjectSet.has(s.id));
  const assignedClassNames = [...new Set(assignedSubjectList.map((s) => s.className))];
  const assignedClassesList = classes.filter((c) => assignedClassNames.includes(c.name));
  const assignedStudents = students.filter((s) => assignedClassNames.includes(s.className));
  const assignedResults = results.filter((r) => teacherSubjectSet.has(r.subjectId));

  const stats = [
    { label: 'Classes', value: assignedClassesList.length, icon: School, cardBg: 'from-blue-600 to-indigo-700', onClick: () => navigate('/teacher/assignments') },
    { label: 'Subjects', value: assignedSubjectList.length, icon: BookOpen, cardBg: 'from-purple-600 to-pink-700', onClick: () => navigate('/teacher/assignments') },
    { label: 'Students', value: assignedStudents.length, icon: Users, cardBg: 'from-emerald-600 to-teal-700' },
    { label: 'Results Entered', value: assignedResults.length, icon: ClipboardList, cardBg: 'from-amber-600 to-orange-700' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground hidden lg:flex"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-semibold text-card-foreground">Teacher Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">{user?.name || 'Teacher'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              {user?.lastLogin && (
                <p className="text-xs text-muted-foreground mt-0.5">Last login: {new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <Avatar className="ring-2 ring-purple-500/20"><AvatarFallback className="bg-purple-500/10 text-purple-500">{(user?.name || 'T').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {(classesLoading || subjectsLoading || studentsLoading || resultsLoading || settingsLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        )}
        {!classesLoading && !subjectsLoading && !studentsLoading && !resultsLoading && !settingsLoading ? (
        <><div className="animate-fade-in">
          <h2 className="text-xl font-semibold text-card-foreground mb-1">Welcome, {user?.name || 'Teacher'}</h2>
          <p className="text-sm text-muted-foreground">Session: {settings?.currentSession} — {semesterLabel(settings?.currentSemester)}</p>
        </div>

        {teacherSubjects.length === 0 && !classesLoading && !subjectsLoading && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> No subjects assigned yet. Ask an admin to assign subjects to you.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className={`p-5 border-0 bg-gradient-to-br ${stat.cardBg} text-white shadow-xl hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 ${stat.onClick ? 'cursor-pointer' : ''}`} onClick={stat.onClick}>
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">{stat.label}</p><p className="text-3xl font-extrabold text-white">{stat.value}</p></div>
                <div className="p-3 rounded-xl bg-white/20"><stat.icon className="w-6 h-6 text-white" /></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-border shadow-md">
            <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><School className="w-5 h-5 text-purple-500" /> Classes</h3>
            <div className="space-y-2">
              {assignedClassesList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No classes assigned yet.</p>
              ) : assignedClassesList.map((c) => {
                const count = students.filter((s) => s.className === c.name).length;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><School className="w-5 h-5 text-purple-500" /></div>
                    <div className="flex-1"><p className="text-sm font-bold text-card-foreground">{c.name}</p><p className="text-xs font-semibold text-muted-foreground">{count} students</p></div>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/teacher/results')}><Award className="w-4 h-4 text-purple-500" /></Button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 border-border shadow-md">
            <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-500" /> Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start gradient-accent text-white border-0 font-bold text-sm" onClick={() => navigate('/teacher/results')}>
                <Award className="w-4 h-4 mr-2" /> Enter Results
              </Button>
              <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/teacher/students')}>
                <Users className="w-4 h-4 mr-2" /> Students
              </Button>
              <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/teacher/attendance')}>
                <CalendarDays className="w-4 h-4 mr-2" /> Take Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/teacher/assignments')}>
                <ClipboardCheck className="w-4 h-4 mr-2" /> Subjects
              </Button>
              <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/admin/promotion')}>
                <TrendingUp className="w-4 h-4 mr-2" /> Promotion Status
              </Button>
            </div>
          </Card>
        </div>
        </>) : null}
      </main>
      </div>
    </div>
  );
}
