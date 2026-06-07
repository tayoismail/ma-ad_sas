import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Download, Moon, LogOut, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import useSettingsStore from '../../store/settingsStore';
import useSubjectsStore from '../../store/subjectsStore';
import { semesterLabel } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function StudentMyResults() {
  const { user, logout } = useAuthStore();
  const { toggleTheme } = useThemeStore();
  const { students, loadStudents } = useStudentsStore();
  const { results, loadResults } = useResultsStore();
  const { loadSettings } = useSettingsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const navigate = useNavigate();

  useEffect(() => { loadSettings(); loadStudents(); loadResults(); loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profile = students.find((s) => s.parentEmail === user?.email || s.studentId === user?.email?.split('@')[0] || s.name === user?.name);
  const myResults = results.filter((r) => r.studentId === profile?.studentId);

  const sessions = [...new Set(myResults.map((r) => r.session))].sort();
  const [selectedSession, setSelectedSession] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (sessions.length && !selectedSession) setSelectedSession(sessions[sessions.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sessionResults = myResults.filter((r) => r.session === selectedSession);
  const sem1Results = sessionResults.filter((r) => r.semester === 1);
  const sem2Results = sessionResults.filter((r) => r.semester === 2);

  const totalSubjects = subjects.filter((s) => s.className === profile?.className).length;
  const calcAvg = (arr) => {
    const denom = totalSubjects || arr.length;
    return denom ? Math.round((arr.reduce((s, r) => s + (r.total || 0), 0) / denom) * 100) / 100 : null;
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const gradeColor = (g) => {
    const map = { A: 'text-emerald-600 bg-emerald-500/10', B: 'text-blue-600 bg-blue-500/10', C: 'text-amber-600 bg-amber-500/10', D: 'text-orange-600 bg-orange-500/10', F: 'text-red-600 bg-red-500/10' };
    return map[g] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/student/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">My Results</h1>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><Moon className="w-5 h-5" /></button>
            <Avatar className="ring-2 ring-emerald-500/20"><AvatarFallback className="bg-emerald-500/10 text-emerald-500">{(user?.name || 'S').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <main className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {!profile ? (
          <Card className="p-12 text-center border-border">
            <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Profile Not Found</h3>
            <p className="text-sm text-muted-foreground">Your student profile could not be found. Contact the school.</p>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.className} · {profile.studentId}</p>
              </div>
              {sessions.length > 1 && (
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
                  className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[160px]">
                  {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Semester 1 Avg</p>
                <p className="text-3xl font-extrabold">{calcAvg(sem1Results) ?? '--'}</p>
              </Card>
              <Card className="p-5 border-0 bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Semester 2 Avg</p>
                <p className="text-3xl font-extrabold">{calcAvg(sem2Results) ?? '--'}</p>
              </Card>
              <Card className="p-5 border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Cumulative</p>
                <p className="text-3xl font-extrabold">
                  {(() => {
                    const s1 = calcAvg(sem1Results); const s2 = calcAvg(sem2Results);
                    if (s1 !== null && s2 !== null) return Math.round(((s1 + s2) / 2) * 100) / 100;
                    return s1 ?? s2 ?? '--';
                  })()}
                </p>
              </Card>
            </div>

            {sessionResults.length === 0 ? (
              <Card className="p-12 text-center border-border">
                <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No results published for {selectedSession} yet.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Subject</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Semester</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Exam</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Test</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionResults.map((r, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-card-foreground">{r.subjectName}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{semesterLabel(r.semester)}</td>
                          <td className="px-4 py-3 text-center text-card-foreground">{r.examScore ?? '--'}</td>
                          <td className="px-4 py-3 text-center text-card-foreground">{r.testScore ?? '--'}</td>
                          <td className="px-4 py-3 text-center font-semibold text-card-foreground">{r.total ?? '--'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColor(r.grade)}`}>{r.grade}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => navigate(`/transcript/${profile.id}`)}>
                <Download className="w-4 h-4 mr-2" /> Download Full Transcript
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
