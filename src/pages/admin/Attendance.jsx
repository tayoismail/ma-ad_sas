import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle,
  AlertCircle, ChevronLeft, ChevronRight, Menu,
  CalendarDays, Users, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useAttendanceStore from '../../store/attendanceStore';
import useSettingsStore from '../../store/settingsStore';
import { semesterLabel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function AttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses } = useClassesStore();
  const { students, loadStudents } = useStudentsStore();
  const { settings, loadSettings } = useSettingsStore();
  const { getRecordsForClass, markAttendance, markBulk } = useAttendanceStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ session: '', semester: '1', className: '' });
  const [today, setToday] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSettings(); loadClasses(); loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (settings) {
      setFilters((f) => ({ ...f, session: settings.currentSession, semester: String(settings.currentSemester) }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  const loadAttendance = useCallback(async () => {
    try {
      const records = await getRecordsForClass(filters.className, filters.session, filters.semester, selectedDate);
      const map = {};
      records.forEach((r) => { map[r.studentId] = r.status; });
      setAttendanceMap(map);
    } catch {
      setAttendanceMap({});
    }
  }, [filters.className, filters.session, filters.semester, selectedDate, getRecordsForClass]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (filters.className && selectedDate) {
      loadAttendance();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [filters.className, selectedDate, loadAttendance]);

  const classStudents = students.filter((s) => s.className === filters.className);

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
    try {
      await markBulk(records);
      const map = {};
      records.forEach((r) => { map[r.studentId] = r.status; });
      setAttendanceMap(map);
    } catch {
      setError('Failed to save attendance');
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);



  const statusBadge = (status) => {
    if (status === 'present') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Present</span>;
    if (status === 'absent') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600"><XCircle className="w-3 h-3" /> Absent</span>;
    if (status === 'late') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600"><AlertCircle className="w-3 h-3" /> Late</span>;
    return <span className="text-xs text-gray-300">--</span>;
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/admin/attendance" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Attendance</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
              <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Attendance saved
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-5 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900">Calendar</h3></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { const d = new Date(year, month - 1, 1); setToday(d); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => { const d = new Date(year, month + 1, 1); setToday(d); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-center font-medium text-sm text-gray-700 mb-3">{MONTHS[month]} {year}</p>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {DAYS.map((d) => <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>)}
                  {calendarDays.map((d, i) => {
                    const dateStr = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    return (
                      <button key={i} disabled={!d}
                        onClick={() => d && setSelectedDate(dateStr)}
                        className={`text-xs py-2 rounded-lg transition-all ${!d ? '' : isSelected ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20' : isToday ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {d || ''}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5 bg-card border-border">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Filters</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                    <input value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                    <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                      <option value="1">{semesterLabel(1)}</option><option value="2">{semesterLabel(2)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                    <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                      <option value="">Select</option>
                      {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {filters.className ? (
                <>
                  <Card className="p-4 bg-card border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{filters.className}</h3>
                      <p className="text-xs text-gray-500">{selectedDate} · {classStudents.length} students</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => markAll('present')} disabled={saving || !classStudents.length}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> All Present
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => markAll('absent')} disabled={saving || !classStudents.length}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> All Absent
                      </Button>
                    </div>
                  </Card>

                  <Card className="overflow-hidden bg-card border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/40 border-b border-white/10">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">#</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">ID</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map((student, i) => {
                            const status = attendanceMap[student.studentId] || '';
                            return (
                              <tr key={student.id} className="border-b border-white/10 hover:bg-white/30">
                                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
                                      {student.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="font-medium text-gray-900 text-sm">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden md:table-cell">{student.studentId || '--'}</td>
                                <td className="px-4 py-3 text-center">{statusBadge(status)}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {['present', 'absent', 'late'].map((s) => (
                                      <button key={s}
                                        onClick={() => setStatus(student.studentId, s)}
                                        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                                          status === s
                                            ? s === 'present' ? 'bg-emerald-500/20 text-emerald-600 ring-2 ring-emerald-500/30'
                                              : s === 'absent' ? 'bg-red-500/20 text-red-600 ring-2 ring-red-500/30'
                                              : 'bg-amber-500/20 text-amber-600 ring-2 ring-amber-500/30'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}>
                                        {s === 'present' ? 'P' : s === 'absent' ? 'A' : 'L'}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {classStudents.length === 0 && (
                      <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No students in this class</p></div>
                    )}
                  </Card>
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-1">Select a Class</h3>
                    <p className="text-sm text-gray-400">Choose a class and date to mark attendance</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
