import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Settings, School, Calendar, Menu, ArrowUpRight, ChevronRight, Award, Moon, Sun, BarChart3, BookMarked, TrendingUp, Bell } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';

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
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    if (!results.length) return counts;
    const scale = settings?.gradingScale || [
      { min: 75, max: 100, grade: 'A' }, { min: 60, max: 74, grade: 'B' },
      { min: 50, max: 59, grade: 'C' }, { min: 40, max: 49, grade: 'D' },
      { min: 0, max: 39, grade: 'F' },
    ];
    for (const r of results) {
      const total = (Number(r.examScore) || 0) + (Number(r.testScore) || 0);
      const capped = Math.min(100, total);
      for (const level of scale) {
        if (capped >= level.min && capped <= level.max) {
          counts[level.grade] = (counts[level.grade] || 0) + 1;
          break;
        }
      }
    }
    return counts;
  }, [results, settings?.gradingScale]);

  const gradeDistribution = [
    { name: 'A', value: gradeCounts.A, color: '#22c55e' },
    { name: 'B', value: gradeCounts.B, color: '#3b82f6' },
    { name: 'C', value: gradeCounts.C, color: '#eab308' },
    { name: 'D', value: gradeCounts.D, color: '#f97316' },
    { name: 'F', value: gradeCounts.F, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />
      <AdminSidebar activePath="/admin/dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/60 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"><Menu className="w-5 h-5" /></button>
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">Last login: {new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
        </main>
      </div>
    </div>
  );
}
