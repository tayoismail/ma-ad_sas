import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, FileText, Menu,
  Printer
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useAttendanceStore from '../../store/attendanceStore';
import useSettingsStore from '../../store/settingsStore';
import { semesterLabel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function AttendanceReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classes, loadClasses } = useClassesStore();
  const { students, loadStudents } = useStudentsStore();
  const { settings, loadSettings } = useSettingsStore();
  const { calculatePercentageBulk } = useAttendanceStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ session: '', semester: '1', className: '' });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, avg: 0, above90: 0, below50: 0 });

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

  const generateReport = async () => {
    if (!filters.className) return;
    setLoading(true);
    const classStudents = students.filter((s) => s.className === filters.className);
    const ids = classStudents.map((s) => s.studentId);
    const pcts = await calculatePercentageBulk(ids, filters.session, filters.semester);
    const data = classStudents.map((s) => ({
      name: s.name,
      studentId: s.studentId,
      attendance: pcts[s.studentId],
    })).sort((a, b) => (b.attendance || 0) - (a.attendance || 0));

    const valid = data.filter((d) => d.attendance !== null);
    const avg = valid.length ? Math.round(valid.reduce((s, d) => s + d.attendance, 0) / valid.length * 100) / 100 : 0;

    setSummary({
      total: data.length,
      avg,
      above90: valid.filter((d) => d.attendance >= 90).length,
      below50: valid.filter((d) => d.attendance < 50).length,
    });
    setReportData(data);
    setLoading(false);
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="min-h-screen bg-slate-300 print:bg-white">
      <AdminSidebar activePath="/admin/attendance/report" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} className="print:hidden" />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border print:hidden">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Attendance Reports</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
              <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          <Card className="p-5 bg-card border-border print:bg-white print:shadow-none print:border">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                <input value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                  <option value="1">{semesterLabel(1)}</option><option value="2">{semesterLabel(2)}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                  <option value="">Select</option>
                  {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={generateReport} disabled={loading || !filters.className} className="w-full gradient-accent text-white border-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generate Report
                </Button>
              </div>
            </div>
          </Card>

          {reportData.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-card border-border text-center">
                  <p className="text-xs text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </Card>
                <Card className="p-4 bg-card border-border text-center">
                  <p className="text-xs text-gray-400">Average Attendance</p>
                  <p className="text-2xl font-bold text-cyan-600">{summary.avg}%</p>
                </Card>
                <Card className="p-4 bg-card border-border text-center">
                  <p className="text-xs text-gray-400">≥90% Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600">{summary.above90}</p>
                </Card>
                <Card className="p-4 bg-card border-border text-center">
                  <p className="text-xs text-gray-400">&lt;50% Attendance</p>
                  <p className="text-2xl font-bold text-red-600">{summary.below50}</p>
                </Card>
              </div>

              <Card className="overflow-hidden bg-card border-border print:bg-white print:shadow-none">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold text-gray-900">{filters.className} — Attendance Report</h3>
                  <p className="text-xs text-gray-400">{filters.session} · {semesterLabel(filters.semester)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/40 border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Attendance %</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((d, i) => (
                        <tr key={d.studentId} className="border-b border-white/10 hover:bg-white/30">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">{d.studentId}</td>
                          <td className="px-4 py-3 text-center">
                            {d.attendance !== null ? (
                              <span className={`font-semibold ${d.attendance >= 90 ? 'text-emerald-600' : d.attendance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {d.attendance}%
                              </span>
                            ) : (
                              <span className="text-gray-300">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.attendance !== null ? (
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                d.attendance >= 90 ? 'bg-emerald-500/10 text-emerald-600' :
                                d.attendance >= 50 ? 'bg-amber-500/10 text-amber-600' :
                                'bg-red-500/10 text-red-600'
                              }`}>
                                {d.attendance >= 90 ? 'Excellent' : d.attendance >= 50 ? 'Fair' : 'Poor'}
                              </span>
                            ) : (
                              <span className="text-gray-300">No data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
