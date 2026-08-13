import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, CreditCard, Menu,
  Printer, Moon, Sun, Download, Search, CheckCircle2, XCircle, Users, TrendingUp
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import usePaymentsStore from '../../store/paymentsStore';
import { semesterLabel, formatStudentName, downloadExcel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { classes, loadClasses } = useClassesStore();
  const { payments, loadPayments, loading } = usePaymentsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    session: '',
    semester: '1',
    className: '',
    search: '',
  });

  useEffect(() => {
    loadSettings();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings) {
      setFilters((f) => ({
        ...f,
        session: settings.currentSession,
        semester: String(settings.currentSemester),
      }));
      loadPayments(settings.currentSession, settings.currentSemester);
    }
  }, [settings, loadPayments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filters.className && p.className !== filters.className) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = p.studentName?.toLowerCase().includes(q);
        const matchId = p.studentId?.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [payments, filters]);

  const stats = useMemo(() => {
    const completed = filteredPayments.filter((p) => p.status === 'completed');
    return {
      totalPayments: completed.length,
      totalAmount: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingPayments: filteredPayments.filter((p) => p.status !== 'completed').length,
    };
  }, [filteredPayments]);

  const handlePrint = () => { window.print(); };

  const handleDownloadExcel = () => {
    const data = filteredPayments.map((p, i) => ({
      '#': i + 1,
      'Student Name': formatStudentName(p.studentName),
      'Student ID': p.studentId || '',
      'Class': p.className || '',
      'Session': p.session || '',
      'Semester': p.semester ? semesterLabel(p.semester) : '',
      'Amount': p.amount || 0,
      'Status': p.status === 'completed' ? 'Paid' : 'Pending',
      'Transaction ID': p.transactionId || '',
      'Paid At': p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-NG') : '',
    }));
    downloadExcel(data, `payments_report_${filters.session}_${semesterLabel(filters.semester)}`);
  };

  return (
    <div className="min-h-screen bg-slate-300 print:bg-white">
      <AdminSidebar activePath="/admin/payments" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} className="print:hidden" />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm print:hidden">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Report Card Payments</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {filteredPayments.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleDownloadExcel}><Download className="w-4 h-4 mr-1" /> Excel</Button>
              )}
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
              <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {/* Filters */}
          <Card className="p-5 bg-card border-border print:bg-white print:shadow-none print:border">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                <input value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                  <option value="1">{semesterLabel(1)}</option>
                  <option value="2">{semesterLabel(2)}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                  <option value="">All Classes</option>
                  {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    placeholder="Name or ID..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={() => loadPayments(filters.session, filters.semester)} disabled={loading} className="w-full gradient-accent text-white border-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  Load Payments
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border-border text-center print:bg-white">
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.totalPayments}</p>
            </Card>
            <Card className="p-4 bg-card border-border text-center print:bg-white">
              <p className="text-xs text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-cyan-600">₦{stats.totalAmount.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-card border-border text-center print:bg-white">
              <p className="text-xs text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</p>
            </Card>
          </div>

          {/* Payments Table */}
          {filteredPayments.length > 0 ? (
            <Card className="overflow-hidden bg-card border-border print:bg-white print:shadow-none">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold text-gray-900">Payment Records</h3>
                <p className="text-xs text-gray-400">{filters.session} · {semesterLabel(filters.semester)} {filters.className ? `· ${filters.className}` : ''}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/40 border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Class</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, i) => (
                      <tr key={p.id} className="border-b border-white/10 hover:bg-white/30">
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatStudentName(p.studentName)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden md:table-cell">{p.studentId}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">{p.className}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">₦{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {p.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                              <XCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No Payments Found</h3>
              <p className="text-sm text-gray-500">No payment records found for the selected filters</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
