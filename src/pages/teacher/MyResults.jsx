import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Award, Menu, Loader2, CheckCircle2, AlertCircle, BookOpen, ArrowLeft, Moon, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useSubjectsStore from '../../store/subjectsStore';
import useResultsStore from '../../store/resultsStore';
import { calculateGrade, calculateTotal, gradeStyle } from '../../lib/grading';
import { semesterLabel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function TeacherMyResults() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses } = useClassesStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { students, loadStudents } = useStudentsStore();
  const { getResultsForClass, saveResults } = useResultsStore();
  const { settings, loadSettings } = useSettingsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ className: '', subjectId: '', session: settings?.currentSession || '2024/2025', semester: String(settings?.currentSemester || 1), sex: '' });
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [useAttendance, setUseAttendance] = useState(() => {
    try { return localStorage.getItem('maad_useAttendance') === 'true'; } catch { return false; }
  });
  const [useTest, setUseTest] = useState(() => {
    try { return localStorage.getItem('maad_useTest') === 'true'; } catch { return false; }
  });
  const [studentSearch, setStudentSearch] = useState('');
  const latestFilterRef = useRef('');

  useEffect(() => { loadSettings(); loadClasses(); loadSubjects(); loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settings) {
      setFilters((f) => ({ ...f, session: settings.currentSession, semester: String(settings.currentSemester) }));
    }
  }, [settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const teacherSubjectIds = user?.teacherSubjects || [];
  const teacherClassNames = [...new Set(
    subjects.filter((s) => teacherSubjectIds.includes(s.id)).map((s) => s.className)
  )];
  const filteredClasses = classes.filter((c) => teacherClassNames.includes(c.name));
  const filteredSubjects = subjects.filter((s) =>
    s.className === filters.className && teacherSubjectIds.includes(s.id)
  );
  const classStudents = students.filter((s) => {
    if (s.className !== filters.className) return false;
    if (filters.sex && s.sex !== filters.sex) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => {
    if (!filters.className || !filters.subjectId) return;
    const token = `${filters.className}_${filters.subjectId}_${filters.session}_${filters.semester}`;
    latestFilterRef.current = token;
    const load = async () => {
      try {
        const results = await getResultsForClass(filters.className, filters.session, filters.semester, filters.subjectId);
        if (latestFilterRef.current !== token) return;
        const map = {};
        for (const r of results) {
          map[r.studentId] = { examScore: r.examScore || 0, testScore: r.testScore || 0, attendance: r.attendance ?? '' };
        }
        setScores(map);
      } catch {
        setError('Failed to load results');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.className, filters.subjectId]);

  const updateScore = (studentId, field, value) => {
    if (value === '' || value === undefined) {
      setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: '' } }));
      return;
    }
    const maxMap = { examScore: useTest ? 70 : 100, testScore: 30, attendance: 100 };
    const max = maxMap[field] ?? 100;
    const num = Math.max(0, Math.min(max, Number(value) || 0));
    setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num } }));
  };

  const handleToggleUseTest = () => {
    setUseTest((prev) => {
      const next = !prev;
      try { localStorage.setItem('maad_useTest', String(next)); } catch { /* silent */ }
      if (next) {
        setScores((s) => {
          const updated = { ...s };
          for (const id of Object.keys(updated)) {
            const exam = Number(updated[id]?.examScore) || 0;
            if (exam > 70) updated[id] = { ...updated[id], examScore: 70 };
          }
          return updated;
        });
      }
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (!filters.className || !filters.subjectId) { setError('Select class and subject'); return; }
    if (!settings) { setError('Settings not loaded yet'); return; }
    setSaving(true); setError(''); setSaved(false);
    const subj = filteredSubjects.find((sub) => String(sub.id) === String(filters.subjectId));
    const records = classStudents.map((s) => {
      const exam = scores[s.studentId]?.examScore || 0;
      const test = scores[s.studentId]?.testScore || 0;
      const total = calculateTotal(exam, test);
      const gradeInfo = calculateGrade(total, settings?.gradingScale);
      return {
        studentId: s.studentId, className: filters.className,
        subjectId: filters.subjectId, subjectName: subj?.name || '',
        session: filters.session, semester: Number(filters.semester),
        examScore: exam,
        testScore: useTest ? test : null,
        total,
        attendance: useAttendance ? (Number(scores[s.studentId]?.attendance) || null) : null,
        ...gradeInfo,
        enteredBy: user?.id, enteredAt: new Date().toISOString(),
      };
    });
    try {
      const ok = await saveResults(records);
      if (ok > 0) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError('No records were saved. Check if the semester is finalized.');
    } catch (err) {
      setError(err.message || 'Failed to save results');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/results" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/teacher/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">My Results</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Teacher'}</p>
                <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'T').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4" /> Results saved successfully</div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value, subjectId: '' })}
              className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[200px]">
              <option value="">Select Class</option>
              {filteredClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {filters.className && (
              <select value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[200px]">
                <option value="">Select Subject</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Session: <strong>{filters.session}</strong></span>
            <span>Semester: <strong>{semesterLabel(Number(filters.semester))}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={useTest} onChange={handleToggleUseTest} className="rounded border-gray-300" />
              Include CA (Continuous Assessment)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={useAttendance} onChange={() => { const next = !useAttendance; setUseAttendance(next); try { localStorage.setItem('maad_useAttendance', String(next)); } catch { /* silent */ } }} className="rounded border-gray-300" />
              Include Attendance %
            </label>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-medium text-muted-foreground">Sex</label>
              <select value={filters.sex} onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
                className="h-9 rounded-lg border-2 border-border/50 bg-white/60 px-3 text-sm focus:outline-none focus:border-primary/40">
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          {filters.className && filters.subjectId && (
            <>
              {classStudents.length === 0 ? (
                <Card className="p-12 text-center border-border">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No students found in this class.</p>
                </Card>
              ) : (
                <Card className="overflow-hidden border-border">
                  <div className="p-3 border-b border-border">
                    <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="w-full sm:w-72 h-10 rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm focus:outline-none focus:border-primary/40" />
                  </div>
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Exam ({useTest ? 70 : 100})</th>
                          {useTest && <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">CA (30)</th>}
                          {useAttendance && <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Attend %</th>}
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((s) => {
                          const exam = scores[s.studentId]?.examScore ?? '';
                          const test = scores[s.studentId]?.testScore ?? '';
                          const total = calculateTotal(Number(exam) || 0, Number(test) || 0);
                          const g = calculateGrade(total, settings?.gradingScale);
                          return (
                            <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-sm font-bold text-primary">
                                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-card-foreground text-base">{s.name}</p>
                                    <p className="text-sm text-muted-foreground">{s.studentId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                  <input type="number" min="0" max={useTest ? 70 : 100} value={exam}
                                   onChange={(e) => updateScore(s.studentId, 'examScore', e.target.value)}
                                   style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                                   className="w-16 sm:w-20 h-11 text-center rounded-lg border-2 border-primary/30 text-sm font-semibold focus:outline-none focus:border-primary/40" />
                               </td>
                               {useTest && (
                               <td className="px-4 py-3 text-center">
                                 <input type="number" min="0" max="30" value={test}
                                   onChange={(e) => updateScore(s.studentId, 'testScore', e.target.value)}
                                   style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                                   className="w-16 sm:w-20 h-11 text-center rounded-lg border-2 border-primary/30 text-sm font-semibold focus:outline-none focus:border-primary/40" />
                               </td>
                               )}
                               {useAttendance && (
                                 <td className="px-4 py-3 text-center">
                                   <input type="number" min="0" max="100" value={scores[s.studentId]?.attendance ?? ''}
                                     onChange={(e) => updateScore(s.studentId, 'attendance', e.target.value)}
                                     style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                                     className="w-16 sm:w-20 h-11 text-center rounded-lg border-2 border-primary/30 text-sm font-semibold focus:outline-none focus:border-primary/40" />
                                </td>
                              )}
                              <td className="px-4 py-3 text-center font-semibold text-card-foreground">{total}</td>
                              <td className="px-4 py-3 text-center">
                                {(() => { const s = gradeStyle(g.grade); return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.text} ${s.bg}`}>{g.grade}</span>; })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-border flex justify-end">
                    <Button onClick={handleSaveAll} disabled={saving} className="gradient-accent text-white border-0">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save All Results
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
          {(!filters.className || !filters.subjectId) && (
            <Card className="p-12 text-center border-border">
              <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Select a Class & Subject</h3>
              <p className="text-sm text-muted-foreground">Choose a class and subject above to start entering results.</p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
