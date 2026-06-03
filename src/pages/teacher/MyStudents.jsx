import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Eye, FileText, GraduationCap, ArrowLeft, Moon, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useSubjectsStore from '../../store/subjectsStore';
import AdminSidebar from '../../components/AdminSidebar';
import DataTable from '../../components/DataTable';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function TeacherMyStudents() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses } = useClassesStore();
  const { students, loadStudents, loading } = useStudentsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    loadClasses();
    loadStudents();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherClassNames = useMemo(() => {
    const ids = user?.teacherSubjects || [];
    if (!ids.length) return [];
    return [...new Set(
      subjects.filter((s) => ids.includes(s.id)).map((s) => s.className)
    )];
  }, [subjects, user?.teacherSubjects]);

  const filteredClasses = classes.filter((c) => teacherClassNames.includes(c.name));
  const classStudents = students.filter((s) => teacherClassNames.includes(s.className));

  const filtered = useMemo(() => {
    return classStudents.filter((s) => {
      const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase());
      const matchClass = !classFilter || s.className === classFilter;
      return matchSearch && matchClass;
    });
  }, [classStudents, search, classFilter]);

  const columns = [
    {
      key: 'studentId', label: 'ID',
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.studentId || '--'}</span>,
    },
    {
      key: 'name', label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            {row.arabicName && <p className="text-xs text-gray-400" dir="rtl">{row.arabicName}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'className', label: 'Class',
      render: (row) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{row.className}</span>
      ),
    },
    {
      key: 'actions', label: 'Actions', sortable: false, width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/transcript/${row.id}`)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500" title="View Profile"><Eye className="w-4 h-4" /></button>
          <button onClick={() => navigate(`/transcript/${row.id}`)} className="p-2 rounded-lg hover:bg-purple-50 text-purple-500" title="Academic Record"><FileText className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/students" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/teacher/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">My Students</h1>
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {!loading && teacherClassNames.length === 0 && (
            <Card className="p-12 text-center border-border">
              <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No Subjects Assigned</h3>
              <p className="text-sm text-muted-foreground">Ask an admin to assign subjects to you so you can see your students.</p>
            </Card>
          )}
          {!loading && teacherClassNames.length > 0 && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Students</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{classStudents.length} student{classStudents.length !== 1 ? 's' : ''} across {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/60" />
                </div>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
                  className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[160px]">
                  <option value="">All Classes</option>
                  {filteredClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <DataTable columns={columns} data={filtered} pageSize={10} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
