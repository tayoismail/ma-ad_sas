import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, School, Hash, Moon, LogOut, CheckCircle2, XCircle, AlertCircle, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useParentStore from '../../store/parentStore';
import useAttendanceStore from '../../store/attendanceStore';
import { semesterLabel } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ParentChildrenAttendance() {
  const { user, logout } = useAuthStore();
  const { toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { children, loading, loadChildren } = useParentStore();
  const { getAttendanceByStudent, calculatePercentage } = useAttendanceStore();
  const navigate = useNavigate();

  const [childAttendance, setChildAttendance] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => { loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.email) loadChildren(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!children.length || !settings) return;
    const load = async () => {
      setLoadingDetails(true);
      const map = {};
      for (const child of children) {
        const records = await getAttendanceByStudent(child.studentId);
        const pct = await calculatePercentage(child.studentId, settings.currentSession, settings.currentSemester);
        const present = records.filter((r) => r.status === 'present').length;
        const absent = records.filter((r) => r.status === 'absent').length;
        const late = records.filter((r) => r.status === 'late').length;
        map[child.studentId] = { records, percentage: pct, present, absent, late };
      }
      setChildAttendance(map);
      setLoadingDetails(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, settings]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const statusIcon = (status) => {
    if (status === 'present') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'absent') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'late') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/parent/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate('/parent/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20"><BookOpen className="w-4 h-4 text-white" /></div>
              <h1 className="text-lg font-semibold text-card-foreground">Children Attendance</h1>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><Moon className="w-5 h-5" /></button>
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
        {(loading || loadingDetails) && (
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
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Attendance Records</h2>
              <p className="text-sm text-muted-foreground">Session: {settings?.currentSession} · {semesterLabel(settings?.currentSemester)}</p>
            </div>

            {children.map((child) => {
              const data = childAttendance[child.studentId];
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-muted/30">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Overall</p>
                      <p className={`text-xl font-bold ${data?.percentage !== null && data?.percentage >= 90 ? 'text-emerald-600' : data?.percentage !== null ? 'text-amber-600' : 'text-muted-foreground/40'}`}>
                        {data?.percentage !== null ? `${data.percentage}%` : '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Present</p>
                      <p className="text-xl font-bold text-emerald-600">{data?.present ?? '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Late</p>
                      <p className="text-xl font-bold text-amber-600">{data?.late ?? '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Absent</p>
                      <p className="text-xl font-bold text-red-600">{data?.absent ?? '--'}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-card-foreground mb-3">Recent Records</h4>
                    {!data || data.records.length === 0 ? (
                      <div className="text-center py-6">
                        <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.records.slice().reverse().slice(0, 30).map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              {statusIcon(r.status)}
                              <span className="text-sm font-medium text-card-foreground capitalize">{r.status}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{r.date}</span>
                          </div>
                        ))}
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
