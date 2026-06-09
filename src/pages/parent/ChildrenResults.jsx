import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, School, Hash, Download, Moon, Sun, LogOut, GraduationCap, Users, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useSubjectsStore from '../../store/subjectsStore';
import useParentStore from '../../store/parentStore';

import { gradeStyle } from '../../lib/grading';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ParentChildrenResults() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { children, childrenResults, loading, loadChildren, loadChildrenResults, getChildCumulative } = useParentStore();
  const navigate = useNavigate();

  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => { loadSettings(); loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.email) loadChildren(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (children.length > 0 && settings) {
      const session = selectedSession || settings.currentSession;
      loadChildrenResults(children, session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, settings, selectedSession]);

  useEffect(() => {
    if (children.length > 0 && settings && !selectedSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSession(settings.currentSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, settings]);

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
            <button onClick={() => navigate('/parent/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate('/parent/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">Children Results</h1>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">{user?.name || 'Parent'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Avatar className="ring-2 ring-indigo-500/20"><AvatarFallback className="bg-indigo-500/10 text-indigo-500">{(user?.name || 'P').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <main className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {!loading && children.length === 0 && (
          <Card className="p-12 text-center border-border">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Children Linked</h3>
            <p className="text-sm text-muted-foreground">Contact the school to link your children using your email: <strong>{user?.email}</strong></p>
          </Card>
        )}
        {!loading && children.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">Academic Results</h2>
                <p className="text-sm text-muted-foreground">{children.length} linked {children.length === 1 ? 'child' : 'children'}</p>
              </div>
              <input type="text" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
                placeholder="Session (e.g. 2024/2025)"
                className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[160px]" />
            </div>

            {children.map((child) => {
              const childResults = childrenResults.filter((r) => r.studentId === child.studentId);
              const sem1Results = childResults.filter((r) => r.semester === 1);
              const sem2Results = childResults.filter((r) => r.semester === 2);
              const totalSubjects = subjects.filter((s) => s.className === child.className).length;
              const sem1Denom = totalSubjects || sem1Results.length;
              const sem2Denom = totalSubjects || sem2Results.length;
              const sem1Avg = sem1Results.length ? Math.round((sem1Results.reduce((s, r) => s + (r.total || 0), 0) / sem1Denom) * 100) / 100 : null;
              const sem2Avg = sem2Results.length ? Math.round((sem2Results.reduce((s, r) => s + (r.total || 0), 0) / sem2Denom) * 100) / 100 : null;
              const cumulative = getChildCumulative(child.studentId, childrenResults, totalSubjects);

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
                        <Download className="w-4 h-4 mr-1" /> Transcript
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-6 bg-muted/30">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sem 1 Avg</p>
                      <p className="text-xl font-bold text-card-foreground">{sem1Avg ?? '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sem 2 Avg</p>
                      <p className="text-xl font-bold text-card-foreground">{sem2Avg ?? '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Cumulative</p>
                      <p className={`text-xl font-bold ${cumulative !== null && cumulative >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{cumulative ?? '--'}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-card-foreground mb-3">All Results ({selectedSession})</h4>
                    {childResults.length === 0 ? (
                      <div className="text-center py-6">
                        <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No results for this session.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Subject</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Sem</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Exam</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">CA</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {childResults.map((r, i) => (
                              <tr key={i} className="border-b border-border">
                                <td className="px-3 py-2 font-medium text-card-foreground">{r.subjectName}</td>
                                <td className="px-3 py-2 text-center text-muted-foreground">{r.semester}</td>
                                <td className="px-3 py-2 text-center text-card-foreground">{r.examScore ?? '--'}</td>
                                <td className="px-3 py-2 text-center text-card-foreground">{r.testScore ?? '--'}</td>
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
            })}
          </>
        )}
      </main>
    </div>
  );
}
