import { useState, useEffect } from 'react';
import { Save, Award, Menu, Loader2, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useSubjectsStore from '../../store/subjectsStore';
import useResultsStore from '../../store/resultsStore';
import { calculateGrade, calculateTotal } from '../../lib/grading';
import { semesterLabel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function TeacherMyResults() {
  const { user } = useAuthStore();
  const { classes, loadClasses } = useClassesStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { students, loadStudents } = useStudentsStore();
  const { getResultsForClass, saveResults } = useResultsStore();
  const { settings, loadSettings } = useSettingsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ className: '', subjectId: '' });
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSettings(); loadClasses(); loadSubjects(); loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settings) {
      setFilters((f) => ({ ...f }));
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
  const classStudents = students.filter((s) => s.className === filters.className);

  const handleLoadResults = async () => {
    if (!filters.className || !filters.subjectId) return;
    const results = await getResultsForClass(filters.className, settings.currentSession, settings.currentSemester, filters.subjectId);
    const map = {};
    for (const r of results) {
      map[r.studentId] = { examScore: r.examScore || 0, testScore: r.testScore || 0 };
    }
    setScores(map);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { handleLoadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.className, filters.subjectId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateScore = (studentId, field, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num } }));
  };

  const handleSaveAll = async () => {
    if (!filters.className || !filters.subjectId) { setError('Select class and subject'); return; }
    setSaving(true); setError(''); setSaved(false);
    const records = classStudents.map((s) => {
      const exam = scores[s.studentId]?.examScore || 0;
      const test = scores[s.studentId]?.testScore || 0;
      const total = calculateTotal(exam, test);
      const session = settings.currentSession;
      const semester = settings.currentSemester;
      return {
        studentId: s.studentId, className: filters.className,
        subjectId: Number(filters.subjectId), subjectName: filteredSubjects.find((sub) => sub.id === Number(filters.subjectId))?.name || '',
        session, semester: Number(semester), examScore: exam, testScore: test, total,
        grade: calculateGrade(total, settings?.gradingScale),
        enteredBy: user?.id, enteredAt: new Date().toISOString(),
      };
    });
    const ok = await saveResults(records);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError('Failed to save results');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/results" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">My Results</h1>
            </div>
            <div className="flex items-center gap-3">
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
            <select value={filters.className} onChange={(e) => setFilters({ className: e.target.value, subjectId: '' })}
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
            <span>Session: <strong>{settings?.currentSession}</strong></span>
            <span>Semester: <strong>{semesterLabel(settings?.currentSemester)}</strong></span>
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Exam Score</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Test Score</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((s) => {
                          const exam = scores[s.studentId]?.examScore ?? '';
                          const test = scores[s.studentId]?.testScore ?? '';
                          const total = calculateTotal(Number(exam) || 0, Number(test) || 0);
                          const grade = calculateGrade(total, settings?.gradingScale);
                          return (
                            <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-card-foreground">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.studentId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input type="number" min="0" max="100" value={exam}
                                  onChange={(e) => updateScore(s.studentId, 'examScore', e.target.value)}
                                  className="w-20 h-9 text-center rounded-lg border-2 border-border/50 bg-background text-sm focus:outline-none focus:border-primary/40" />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input type="number" min="0" max="100" value={test}
                                  onChange={(e) => updateScore(s.studentId, 'testScore', e.target.value)}
                                  className="w-20 h-9 text-center rounded-lg border-2 border-border/50 bg-background text-sm focus:outline-none focus:border-primary/40" />
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-card-foreground">{total}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  grade === 'A' ? 'text-emerald-600 bg-emerald-500/10' :
                                  grade === 'B' ? 'text-blue-600 bg-blue-500/10' :
                                  grade === 'C' ? 'text-amber-600 bg-amber-500/10' :
                                  grade === 'D' ? 'text-orange-600 bg-orange-500/10' :
                                  'text-red-600 bg-red-500/10'
                                }`}>{grade}</span>
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
