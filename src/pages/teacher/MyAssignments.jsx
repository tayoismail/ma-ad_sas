import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, School, Users, Menu, ArrowLeft, Moon, Sun, LogOut, AlertCircle, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useSubjectsStore from '../../store/subjectsStore';
import useStudentsStore from '../../store/studentsStore';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import AdminSidebar from '../../components/AdminSidebar';

export default function TeacherMyAssignments() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { classes, loadClasses, loading: classesLoading } = useClassesStore();
  const { subjects, loadSubjects, loading: subjectsLoading } = useSubjectsStore();
  const { students, loadStudents, loading: studentsLoading } = useStudentsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadStudents();
  }, []);

  const teacherSubjectIds = user?.teacherSubjects || [];
  const teacherSubjectSet = new Set(teacherSubjectIds);

  // Get assigned subjects with their class info
  const assignedSubjects = subjects.filter((s) => teacherSubjectSet.has(s.id));

  // Get unique class names from assigned subjects
  const assignedClassNames = [...new Set(assignedSubjects.map((s) => s.className))];

  // Get assigned classes with student counts
  const assignedClasses = assignedClassNames.map((name) => {
    const classObj = classes.find((c) => c.name === name);
    const studentCount = students.filter((s) => s.className === name).length;
    const classSubjects = assignedSubjects.filter((s) => s.className === name);
    return {
      id: classObj?.id || name,
      name,
      studentCount,
      subjects: classSubjects,
    };
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const isLoading = classesLoading || subjectsLoading || studentsLoading;

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/teacher/assignments" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/teacher/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground hidden lg:flex">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-card-foreground">Subjects</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-card-foreground">{user?.name || 'Teacher'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Avatar className="ring-2 ring-purple-500/20">
                <AvatarFallback className="bg-purple-500/10 text-purple-500">
                  {(user?.name || 'T').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading assignments...</p>
              </div>
            </div>
          )}

          {!isLoading && teacherSubjectIds.length === 0 && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No subjects assigned yet. Ask an admin to assign subjects to you.
            </div>
          )}

          {!isLoading && teacherSubjectIds.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 animate-fade-in">
                <Card className="p-5 border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">Classes</p>
                      <p className="text-3xl font-extrabold text-white">{assignedClasses.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/20">
                      <School className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-0 bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">Subjects</p>
                      <p className="text-3xl font-extrabold text-white">{assignedSubjects.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/20">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">Total Students</p>
                      <p className="text-3xl font-extrabold text-white">
                        {assignedClasses.reduce((sum, c) => sum + c.studentCount, 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/20">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Classes and Subjects */}
              <div className="space-y-6">
                {assignedClasses.map((cls) => (
                  <Card key={cls.id} className="border-border shadow-md overflow-hidden animate-fade-in">
                    <div className="p-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <School className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-card-foreground">{cls.name}</h2>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-semibold">
                          {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Assigned Subjects</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cls.subjects.map((subject) => (
                          <div
                            key={subject.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center flex-shrink-0 group-hover:from-purple-500/25 group-hover:to-pink-500/25 transition-all">
                              <BookOpen className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-card-foreground truncate">{subject.name}</p>
                              <p className="text-xs text-muted-foreground">{cls.name}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-purple-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* All Subjects List */}
              <Card className="border-border shadow-md animate-fade-in">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-card-foreground">All Assigned Subjects</h2>
                      <p className="text-sm text-muted-foreground">Complete list of your assigned subjects</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Subject Name</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedSubjects.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => (
                          <tr key={subject.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-purple-500" />
                                </div>
                                <span className="font-medium text-card-foreground">{subject.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
                                {subject.className}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
