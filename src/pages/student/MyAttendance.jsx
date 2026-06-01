import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, BookOpen, Moon, LogOut, CheckCircle2, XCircle, AlertCircle, School } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useStudentsStore from '../../store/studentsStore';
import useAttendanceStore from '../../store/attendanceStore';
import useSettingsStore from '../../store/settingsStore';

import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function StudentMyAttendance() {
  const { user, logout } = useAuthStore();
  const { toggleTheme } = useThemeStore();
  const { students, loadStudents } = useStudentsStore();
  const { settings, loadSettings } = useSettingsStore();
  const { getAttendanceByStudent, calculatePercentage } = useAttendanceStore();
  const navigate = useNavigate();

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [percentage, setPercentage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profile = students.find((s) => s.studentId === user?.email?.split('@')[0] || s.parentEmail === user?.email || s.name === user?.name);

  useEffect(() => {
    if (!profile || !settings) return;
    const load = async () => {
      setLoading(true);
      const records = await getAttendanceByStudent(profile.studentId);
      setAttendanceRecords(records);
      const pct = await calculatePercentage(profile.studentId, settings.currentSession, settings.currentSemester);
      setPercentage(pct);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, settings]);

  const sessionRecords = attendanceRecords.filter((r) => r.session === settings?.currentSession);
  const present = sessionRecords.filter((r) => r.status === 'present').length;
  const absent = sessionRecords.filter((r) => r.status === 'absent').length;
  const late = sessionRecords.filter((r) => r.status === 'late').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const statusIcon = (status) => {
    if (status === 'present') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'absent') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === 'late') return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">My Attendance</h1>
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          <Card className="p-12 text-center border-border">
            <School className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Profile Not Found</h3>
            <p className="text-sm text-muted-foreground">Contact the school to link your account.</p>
          </Card>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.className} · Session: {settings?.currentSession}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-5 border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Attendance</p>
                <p className="text-3xl font-extrabold">{percentage !== null ? `${percentage}%` : '--'}</p>
              </Card>
              <Card className="p-5 border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Present</p>
                <p className="text-3xl font-extrabold">{present}</p>
              </Card>
              <Card className="p-5 border-0 bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Late</p>
                <p className="text-3xl font-extrabold">{late}</p>
              </Card>
              <Card className="p-5 border-0 bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl">
                <p className="text-sm font-bold text-white/80 mb-1">Absent</p>
                <p className="text-3xl font-extrabold">{absent}</p>
              </Card>
            </div>

            <Card className="p-6 border-border shadow-md">
              <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Attendance History</h3>
              {attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessionRecords.slice().reverse().slice(0, 50).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {statusIcon(r.status)}
                        <span className="text-sm font-medium text-card-foreground capitalize">{r.status}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
