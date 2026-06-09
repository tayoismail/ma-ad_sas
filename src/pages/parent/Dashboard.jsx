import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Award, LogOut,
  GraduationCap, School, Hash,
  Download, Moon, Sun, BarChart3, CalendarDays, ArrowLeft
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useSubjectsStore from '../../store/subjectsStore';
import { semesterLabel } from '../../lib/utils';
import { gradeStyle } from '../../lib/grading';
import useParentStore from '../../store/parentStore';
import useAttendanceStore from '../../store/attendanceStore';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ParentDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { children, childrenResults, childrenAttendance, loading, loadChildren, loadChildrenResults, loadChildrenAttendance, getChildCumulative } = useParentStore();
  const { calculatePercentageBulk } = useAttendanceStore();
  const [attBySem, setAttBySem] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadChildren(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (children.length > 0 && settings) {
      loadChildrenResults(children, settings.currentSession);
      loadChildrenAttendance(children, settings.currentSession, settings.currentSemester);
      // Load attendance for both semesters for cumulative calculation
      const ids = children.map((c) => c.studentId);
      Promise.all([
        calculatePercentageBulk(ids, settings.currentSession, 1),
        calculatePercentageBulk(ids, settings.currentSession, 2),
      ]).then(([m1, m2]) => setAttBySem({ 1: m1, 2: m2 })).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, settings]);

  const attThreshold = settings?.attendanceThreshold ?? 90;

  const handleLogout = () => { logout(); navigate('/login'); };

  const gradeColor = (g) => {
    const s = gradeStyle(g);
    return `${s.text} ${s.bg}`;
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">Parent Portal</h1>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">{user?.name || 'Parent'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              {user?.lastLogin && (
                <p className="text-xs text-muted-foreground mt-0.5">Last login: {new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <Avatar className="ring-2 ring-indigo-500/20"><AvatarFallback className="bg-indigo-500/10 text-indigo-500">{(user?.name || 'P').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading children data...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-card-foreground mb-1">Welcome, {user?.name || 'Parent'}</h2>
              <p className="text-sm text-muted-foreground">Session: {settings?.currentSession || '--'} · {children.length} linked {children.length === 1 ? 'child' : 'children'}</p>
            </div>

            {children.length === 0 ? (
              <Card className="p-12 text-center border-border">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No Children Linked</h3>
                <p className="text-sm text-muted-foreground mb-6">Contact the school to link your children using your email: <strong>{user?.email}</strong></p>
                <p className="text-xs text-muted-foreground">The school needs to set your email as the parent email on each child's profile.</p>
              </Card>
            ) : (
              children.map((child) => {
                const childResults = childrenResults.filter((r) => r.studentId === child.studentId);
                const sem1Results = childResults.filter((r) => r.semester === 1);
                const sem2Results = childResults.filter((r) => r.semester === 2);
                const totalSubjects = subjects.filter((s) => s.className === child.className).length;
                const sem1Avg = totalSubjects ? Math.round((sem1Results.reduce((s, r) => s + (r.total || 0), 0) / totalSubjects) * 100) / 100 : null;
                const sem2Avg = totalSubjects ? Math.round((sem2Results.reduce((s, r) => s + (r.total || 0), 0) / totalSubjects) * 100) / 100 : null;
                const cumulative = getChildCumulative(child.studentId, childrenResults, totalSubjects, settings, attBySem);
                const attPct = childrenAttendance[child.studentId];

                return (
                  <Card key={child.id} className="overflow-hidden border-border">
                    <div className="p-6 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-indigo-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground">{child.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><School className="w-3.5 h-3.5" /> {child.className}</span>
                              <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {child.studentId}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => navigate(`/transcript/${child.id}`)} className="gradient-accent text-white border-0">
                          <Download className="w-4 h-4 mr-1" /> Full Record
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/30">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">معدل {semesterLabel(1)}</p>
                        <p className="text-xl font-bold text-card-foreground">{sem1Avg ?? '--'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">معدل {semesterLabel(2)}</p>
                        <p className="text-xl font-bold text-card-foreground">{sem2Avg ?? '--'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Cumulative</p>
                        <p className={`text-xl font-bold ${cumulative !== null && cumulative >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{cumulative ?? '--'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className={`text-xl font-bold ${attPct !== null && attPct >= attThreshold ? 'text-emerald-600' : attPct !== null ? 'text-amber-600' : 'text-muted-foreground/40'}`}>{attPct !== null ? `${attPct}%` : '--'}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-card-foreground mb-3">Recent Results</h4>
                      {childResults.length === 0 ? (
                        <div className="text-center py-6">
                          <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No results yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Subject</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">الفصل</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Score</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {childResults.slice(0, 8).map((r, i) => (
                                <tr key={i} className="border-b border-border">
                                  <td className="px-3 py-2 font-medium text-card-foreground">{r.subjectName}</td>
                                  <td className="px-3 py-2 text-center text-muted-foreground">{semesterLabel(r.semester)}</td>
                                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{r.total}</td>
                                  <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColor(r.grade)}`}>{r.grade}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
            {children.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button className="w-full justify-start gradient-accent text-white border-0 font-bold text-sm shadow-lg shadow-purple-500/20" onClick={() => navigate('/parent/results')}>
                  <BarChart3 className="w-4 h-4 mr-2" /> View Full Results
                </Button>
                <Button variant="outline" className="w-full justify-start font-semibold text-sm" onClick={() => navigate('/parent/attendance')}>
                  <CalendarDays className="w-4 h-4 mr-2" /> Attendance History
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
