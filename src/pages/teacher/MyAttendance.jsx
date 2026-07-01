import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Menu, CalendarDays, School, ArrowLeft, Moon, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useAttendanceStore from '../../store/attendanceStore';
import useSettingsStore from '../../store/settingsStore';
import useSubjectsStore from '../../store/subjectsStore';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function TeacherMyAttendance() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses } = useClassesStore();
  const { students, loadStudents } = useStudentsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { settings, loadSettings } = useSettingsStore();
  const { getRecordsForClass, markAttendance, markBulk } = useAttendanceStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ session: '', semester: '1', className: '', sex: '' });
  const [today] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => { loadSettings(); loadClasses(); loadStudents(); loadSubjects();
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

  const loadAttendance = useCallback(async () => {
    if (!filters.className) return;
    const records = await getRecordsForClass(filters.className, filters.session, filters.semester, selectedDate);
    const map = {};
    records.forEach((r) => { map[r.studentId] = r.status; });
    setAttendanceMap(map);
  }, [filters.className, filters.session, filters.semester, selectedDate, getRecordsForClass]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (filters.className && selectedDate) loadAttendance();
  }, [filters.className, selectedDate, loadAttendance]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const classStudents = students.filter((s) => {
    if (s.className !== filters.className) return false;
    if (filters.sex && s.sex !== filters.sex) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q);
    }
    return true;
  });

  const setStatus = async (studentId, targetStatus) => {
    const currentStatus = attendanceMap[studentId] || '';
    if (targetStatus === currentStatus) return;
    setAttendanceMap((prev) => ({ ...prev, [studentId]: targetStatus }));
    try {
      await markAttendance(studentId, filters.className, filters.session, filters.semester, selectedDate, targetStatus);
    } catch {
      setAttendanceMap((prev) => ({ ...prev, [studentId]: currentStatus }));
    }
  };

  const markAll = async (status) => {
    setSaving(true);
    const records = classStudents.map((s) => ({
      studentId: s.studentId, className: filters.className,
      session: filters.session, semester: Number(filters.semester),
      date: selectedDate, status,
    }));
    await markBulk(records);
    const map = {};
    records.forEach((r) => { map[r.studentId] = r.status; });
    setAttendanceMap(map);
    setSaved(true); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const dateStr = `${DAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/attendance" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/teacher/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">My Attendance</h1>
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
          {saved && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in"><CheckCircle2 className="w-4 h-4" /> Attendance saved</div>
          )}
          {teacherClassNames.length === 0 ? (
            <Card className="p-12 text-center border-border">
              <School className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No Classes Assigned</h3>
              <p className="text-sm text-muted-foreground">Ask an admin to assign subjects to you.</p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                  className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[200px]">
                  <option value="">Select Class</option>
                  {filteredClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {filters.className && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Sex</label>
                    <select value={filters.sex} onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
                      className="h-9 rounded-lg border-2 border-border/50 bg-white/60 px-3 text-sm focus:outline-none focus:border-primary/40">
                      <option value="">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                )}
              </div>
              {filters.className && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-card-foreground truncate hidden sm:inline">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => changeDate(-1)} className="px-2"><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-sm font-medium text-card-foreground min-w-[100px] text-center">{selectedDate}</span>
                      <Button variant="outline" size="sm" onClick={() => changeDate(1)} className="px-2"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => markAll('present')} disabled={saving} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs sm:text-sm px-2">All Present</Button>
                      <Button variant="outline" size="sm" onClick={() => markAll('absent')} disabled={saving} className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm px-2">All Absent</Button>
                    </div>
                  </div>
                  <Card className="overflow-hidden border-border">
                    <div className="p-3 border-b border-border">
                      <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search by name or ID..."
                        className="w-full sm:w-72 h-10 rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm focus:outline-none focus:border-primary/40" />
                    </div>
                    <div className="divide-y divide-border">
                      {classStudents.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No students in this class.</div>
                      ) : classStudents.map((s) => {
                        const status = attendanceMap[s.studentId];
                        return (
                          <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
                                {s.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-card-foreground">{s.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-muted-foreground">{s.studentId}</p>
                                  {s.sex && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.sex === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>{s.sex}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 pl-11 sm:pl-0">
                              {['present', 'absent', 'late'].map((statusType) => (
                                <button key={statusType}
                                  onClick={() => setStatus(s.studentId, statusType)}
                                  className={`px-3 py-2 rounded-xl transition-all text-xs font-medium flex items-center gap-1 ${
                                    status === statusType
                                      ? statusType === 'present' ? 'bg-emerald-500/20 text-emerald-600 ring-2 ring-emerald-500/30'
                                        : statusType === 'absent' ? 'bg-red-500/20 text-red-600 ring-2 ring-red-500/30'
                                        : 'bg-amber-500/20 text-amber-600 ring-2 ring-amber-500/30'
                                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                  }`}>
                                  {statusType === 'present' ? <CheckCircle2 className="w-4 h-4" /> : statusType === 'absent' ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                  <span className="hidden sm:inline">{statusType.charAt(0).toUpperCase() + statusType.slice(1)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
