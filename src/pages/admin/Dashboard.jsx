import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Settings, School, Calendar, Menu, ArrowUpRight, ChevronRight, Award, Moon, Sun, BarChart3, BookMarked, TrendingUp, Bell, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import useSubjectsStore from '../../store/subjectsStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import { useThemeStore } from '../../store/themeStore';
import { semesterLabel } from '../../lib/utils';
import { gradeStyle } from '../../lib/grading';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const { classes, loadClasses } = useClassesStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { students, loadStudents } = useStudentsStore();
  const { results, loadResults } = useResultsStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadSubjects();
    loadStudents();
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  const loadPendingTeachers = useCallback(async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const teachers = allUsers.filter((u) => u.role === 'teacher' && u.teacherSubjects?.length);
      if (!teachers.length || !settings) {
        setPendingTeachers([]);
        return;
      }
      const session = settings.currentSession;
      const semester = settings.currentSemester;
      const resultsSnap = await getDocs(
        query(collection(db, 'results'), where('session', '==', session), where('semester', '==', semester))
      );
      const results = resultsSnap.docs.map((d) => d.data());
      const pending = [];
      for (const t of teachers) {
        const subjectIds = t.teacherSubjects;
        const missingSubjects = [];
        for (const sid of subjectIds) {
          const count = results.filter((r) => String(r.subjectId) === String(sid)).length;
          if (count === 0) {
            const sub = subjects.find((s) => s.id === sid);
            if (sub) missingSubjects.push(sub);
          }
        }
        if (missingSubjects.length) {
          pending.push({ teacher: t, missingSubjects });
        }
      }
      setPendingTeachers(pending);
    } catch { /* ignore */ }
  }, [settings, subjects]);

  useEffect(() => {
    if (settings && subjects.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPendingTeachers().finally(() => setTeachersLoading(false));
    }
  }, [settings, subjects, loadPendingTeachers]);

  const stats = [
    { label: 'Total Students', value: students.length || '--', icon: Users, cardBg: 'from-blue-600 to-indigo-700' },
    { label: 'Total Subjects', value: subjects.length || '--', icon: BookMarked, cardBg: 'from-purple-600 to-pink-700' },
    { label: 'Active Classes', value: classes.length || '--', icon: School, cardBg: 'from-emerald-600 to-teal-700' },
    { label: 'Current Session', value: settings?.currentSession || '--', icon: Calendar, cardBg: 'from-amber-600 to-orange-700' },
  ];

  const quickActions = [
    { label: 'Manage Students', icon: Users, cardBg: 'from-blue-500 to-blue-600', path: '/admin/students' },
    { label: 'Manage Classes', icon: School, cardBg: 'from-emerald-500 to-emerald-600', path: '/admin/classes' },
    { label: 'Manage Subjects', icon: BookMarked, cardBg: 'from-purple-500 to-purple-600', path: '/admin/subjects' },
    { label: 'Enter Results', icon: Award, cardBg: 'from-amber-500 to-amber-600', path: '/admin/results' },
    { label: 'Promotion', icon: ArrowUpRight, cardBg: 'from-rose-500 to-rose-600', path: '/admin/promotion' },
    { label: 'School Settings', icon: Settings, cardBg: 'from-zinc-500 to-zinc-600', path: '/admin/settings' },
  ];

  const classPopulation = classes.slice(0, 11).map((c) => ({
    name: c.name,
    students: students.filter((s) => s.className === c.name).length,
  }));

  const gradeCounts = useMemo(() => {
    if (!results.length) return {};
    const scale = settings?.gradingScale || [
      { min: 0, max: 39, grade: 'F' }, { min: 40, max: 49, grade: 'D' },
      { min: 50, max: 59, grade: 'C' }, { min: 60, max: 74, grade: 'B' },
      { min: 75, max: 100, grade: 'A' },
    ];
    const counts = Object.fromEntries(scale.map((l) => [l.grade, 0]));
    for (const r of results) {
      const total = (Number(r.examScore) || 0) + (Number(r.testScore) || 0);
      const capped = Math.min(100, total);
      for (const level of scale) {
        if (capped >= level.min && capped <= level.max) {
          counts[level.grade] += 1;
          break;
        }
      }
    }
    return counts;
  }, [results, settings?.gradingScale]);

  const gradeDistribution = useMemo(() =>
    Object.entries(gradeCounts).map(([name, value]) => {
      const s = gradeStyle(name);
      return { name, value, color: s.hex };
    }),
  [gradeCounts]);

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />
      <AdminSidebar activePath="/admin/dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground"><Bell className="w-5 h-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" /></button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-card-foreground">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                {user?.lastLogin && (
                  <p className="text-xs text-muted-foreground mt-0.5">Last login: {new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
              </div>
                <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-8">
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

          <div>
            <h2 className="text-lg font-bold text-card-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => (
                <button key={action.label} onClick={() => navigate(action.path)} className={`p-5 rounded-2xl bg-gradient-to-br ${action.cardBg} text-white shadow-lg hover:shadow-xl hover:shadow-black/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 text-center cursor-pointer border-0`}>
                  <action.icon className="w-7 h-7 mx-auto mb-2" /><span className="text-sm font-bold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border shadow-md">
              <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Class Population</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPopulation} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                      {classPopulation.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-md">
              <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Grade Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {results.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {gradeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No result data available</p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border shadow-md">
              <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><School className="w-5 h-5 text-primary" /> School Info</h3>
              <div className="space-y-3">
                {[
                  { icon: School, label: 'School Name', value: settings?.schoolName },
                  { icon: Calendar, label: 'Current Session', value: settings?.currentSession },
                  { icon: GraduationCap, label: 'الفصل الدراسي', value: semesterLabel(settings?.currentSemester || 1) },
                  { icon: Users, label: 'Classes', value: `${classes.length} configured` },
                  { icon: BookMarked, label: 'Subjects', value: `${subjects.length} total` },
                  { icon: Users, label: 'Students', value: `${students.length} enrolled` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-card-foreground flex-1">{item.label}</span>
                    <span className="text-sm font-bold text-card-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Promotion Flow */}
            <Card className="p-6 border-border shadow-md">
              <h3 className="text-base font-bold text-card-foreground mb-5 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Promotion Flow</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {classes.slice(0, 11).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500' : i === 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="text-card-foreground font-bold">{c.name}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Teachers Pending Results */}
          <Card className="p-6 border-border shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Teachers Yet to Upload Results
              </h3>
              {!teachersLoading && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  {pendingTeachers.length} pending
                </span>
              )}
            </div>
            {teachersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : pendingTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500/40 mb-3" />
                <p className="text-sm font-medium text-card-foreground">All teachers have uploaded results</p>
                <p className="text-xs text-muted-foreground mt-1">No pending subjects for the current session</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTeachers.map(({ teacher, missingSubjects }) => (
                  <div key={teacher.id} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                      </div>
                      <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                        {missingSubjects.length} subject{missingSubjects.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSubjects.map((sub) => (
                        <span key={sub.id} className="text-xs bg-card border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                          {sub.name} <span className="text-[10px] opacity-60">({sub.className})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
