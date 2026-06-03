import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, LogOut, TrendingUp, User, School, Hash, Calendar, Download, Moon, Sun, Clock, BarChart3, CalendarDays, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import useSettingsStore from '../../store/settingsStore';
import { semesterLabel } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function StudentDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { students, loadStudents, loading: studentsLoading } = useStudentsStore();
  const { results, loadResults, loading: resultsLoading } = useResultsStore();
  const { settings, loadSettings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadStudents();
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profile = students.find((s) => s.studentId === user?.email?.split('@')[0] || s.parentEmail === user?.email || s.name === user?.name);
  const myResults = results.filter((r) => r.studentId === profile?.studentId);
  const sem1Results = myResults.filter((r) => r.semester === 1);
  const sem2Results = myResults.filter((r) => r.semester === 2);
  const sem1Avg = sem1Results.length ? Math.round((sem1Results.reduce((s, r) => s + (r.total || 0), 0) / sem1Results.length) * 100) / 100 : null;
  const sem2Avg = sem2Results.length ? Math.round((sem2Results.reduce((s, r) => s + (r.total || 0), 0) / sem2Results.length) * 100) / 100 : null;
  const cumulative = (sem1Avg !== null && sem2Avg !== null) ? Math.round(((sem1Avg + sem2Avg) / 2) * 100) / 100 : (sem1Avg ?? sem2Avg);

  const stats = [
    { label: 'الفصل الحالي', value: semesterLabel(settings?.currentSemester || 1), icon: Clock, cardBg: 'from-blue-600 to-indigo-700' },
    { label: 'Class', value: profile?.className || '--', icon: School, cardBg: 'from-purple-600 to-pink-700' },
    { label: 'Average', value: cumulative ?? '--', icon: TrendingUp, cardBg: 'from-emerald-600 to-teal-700' },
    { label: 'Subjects', value: myResults.length ? [...new Set(myResults.map((r) => r.subjectName))].length : '--', icon: BookOpen, cardBg: 'from-amber-600 to-orange-700' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const gradeColor = (grade) => {
    const map = { A: 'text-emerald-600 bg-emerald-500/10', B: 'text-blue-600 bg-blue-500/10', C: 'text-amber-600 bg-amber-500/10', D: 'text-orange-600 bg-orange-500/10', F: 'text-red-600 bg-red-500/10' };
    return map[grade] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">Student Portal</h1>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">{user?.name || 'Student'}</p>
              {user?.lastLogin && (
                <p className="text-xs text-muted-foreground">Last login: {new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
            <Avatar className="ring-2 ring-emerald-500/20"><AvatarFallback className="bg-emerald-500/10 text-emerald-500">{(user?.name || 'S').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {(studentsLoading || resultsLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your data...</p>
            </div>
          </div>
        )}
        {!studentsLoading && !resultsLoading && (
        <><div className="animate-fade-in">
          <h2 className="text-xl font-semibold text-card-foreground mb-1">Welcome, {user?.name || 'Student'}</h2>
          <p className="text-sm text-muted-foreground">Session: {settings?.currentSession || '--'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <Card key={stat.label} className={`p-5 border-0 bg-gradient-to-br ${stat.cardBg} text-white shadow-xl hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">{stat.label}</p><p className="text-3xl font-extrabold text-white">{stat.value}</p></div>
                <div className="p-3 rounded-xl bg-white/20"><stat.icon className="w-6 h-6 text-white" /></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-border shadow-md">
            <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" /> My Profile</h3>
            <div className="space-y-3">
              {[
                { icon: User, label: 'Name', value: profile?.name || user?.name },
                { icon: School, label: 'Class', value: profile?.className },
                { icon: Hash, label: 'Student ID', value: profile?.studentId },
                { icon: Calendar, label: 'Enrolled', value: profile?.enrollmentDate },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <item.icon className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-card-foreground flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-card-foreground">{item.value || '--'}</span>
                </div>
              ))}
            </div>
            {profile && (
              <Button variant="outline" className="w-full mt-4 font-semibold text-sm" onClick={() => navigate(`/transcript/${profile.id}`)}>
                <Download className="w-4 h-4 mr-2" /> View Full Academic Record
              </Button>
            )}
          </Card>

          <Card className="p-6 border-border shadow-md">
            <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><Award className="w-5 h-5 text-emerald-500" /> Recent Results</h3>
            {myResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="w-16 h-16 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No results published yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myResults.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{r.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{semesterLabel(r.semester)}</p>
                    </div>
                    <span className="text-sm font-semibold text-card-foreground">{r.total}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColor(r.grade)}`}>{r.grade}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-6 border-border shadow-md">
            <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-500" /> Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start gradient-accent text-white border-0 font-bold text-sm" onClick={() => navigate('/student/results')}>
                <Award className="w-4 h-4 mr-2" /> View All Results
              </Button>
              <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/student/attendance')}>
                <CalendarDays className="w-4 h-4 mr-2" /> Attendance History
              </Button>
            </div>
          </Card>
        </div>
        </>)}
      </main>
    </div>
  );
}
