import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Menu, Search, Filter, Clock, RefreshCw, Download,
  User, FileText, Moon, Sun
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Card } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import AdminSidebar from '../../components/AdminSidebar';



const ACTION_LABELS = {
  'user.login': 'Login',
  'user.logout': 'Logout',
  'user.create': 'User Created',
  'user.update': 'User Updated',
  'user.delete': 'User Deleted',
  'student.create': 'Student Added',
  'student.update': 'Student Updated',
  'student.delete': 'Student Deleted',
  'student.bulk_create': 'Bulk Import',
  'results.create': 'Result Created',
  'results.update': 'Result Updated',
  'results.save_batch': 'Results Saved',
  'results.delete': 'Result Deleted',
  'attendance.create': 'Attendance Marked',
  'attendance.update': 'Attendance Updated',
  'attendance.mark_bulk': 'Attendance Bulk',
  'class.create': 'Class Created',
  'class.update': 'Class Updated',
  'class.delete': 'Class Deleted',
  'subject.create': 'Subject Created',
  'subject.update': 'Subject Updated',
  'subject.delete': 'Subject Deleted',
  'settings.update': 'Settings Updated',
  'promotion.confirm': 'Student Promoted',
  'promotion.confirm_batch': 'Batch Promotion',
};

const ACTION_COLORS = {
  'user.login': 'bg-blue-500/10 text-blue-600',
  'user.logout': 'bg-gray-500/10 text-gray-600',
  'user.create': 'bg-green-500/10 text-green-600',
  'user.update': 'bg-amber-500/10 text-amber-600',
  'user.delete': 'bg-red-500/10 text-red-600',
  'student.create': 'bg-green-500/10 text-green-600',
  'student.update': 'bg-amber-500/10 text-amber-600',
  'student.delete': 'bg-red-500/10 text-red-600',
  'student.bulk_create': 'bg-purple-500/10 text-purple-600',
  'results.create': 'bg-emerald-500/10 text-emerald-600',
  'results.update': 'bg-emerald-500/10 text-emerald-600',
  'results.save_batch': 'bg-emerald-500/10 text-emerald-600',
  'results.delete': 'bg-red-500/10 text-red-600',
  'attendance.create': 'bg-cyan-500/10 text-cyan-600',
  'attendance.update': 'bg-cyan-500/10 text-cyan-600',
  'attendance.mark_bulk': 'bg-cyan-500/10 text-cyan-600',
  'class.create': 'bg-green-500/10 text-green-600',
  'class.update': 'bg-amber-500/10 text-amber-600',
  'class.delete': 'bg-red-500/10 text-red-600',
  'subject.create': 'bg-green-500/10 text-green-600',
  'subject.update': 'bg-amber-500/10 text-amber-600',
  'subject.delete': 'bg-red-500/10 text-red-600',
  'settings.update': 'bg-violet-500/10 text-violet-600',
  'promotion.confirm': 'bg-teal-500/10 text-teal-600',
  'promotion.confirm_batch': 'bg-teal-500/10 text-teal-600',
};

const ENTITY_ICONS = {
  users: User,
  students: FileText,
  results: FileText,
  attendance: FileText,
  classes: FileText,
  subjects: FileText,
  settings: FileText,
  promotions: FileText,
};

function formatDetails(action, details) {
  if (!details || Object.keys(details).length === 0) return null;
  const parts = [];
  if (details.name) parts.push(details.name);
  if (details.className) parts.push(details.className);
  if (details.count != null) parts.push(`${details.count} records`);
  if (details.success != null && details.errors != null) parts.push(`${details.success} ok, ${details.errors} errors`);
  if (details.created != null && details.updated != null) parts.push(`${details.created} new, ${details.updated} updated`);
  if (details.email) parts.push(details.email);
  if (details.fields && !action.includes('login') && !action.includes('logout')) parts.push(`fields: ${details.fields.join(', ')}`);
  if (details.cascadeDeletes) parts.push(`${details.cascadeDeletes} related records deleted`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return ts;
  }
}

export default function AuditLogPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(500)));
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
    setLoading(false);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (log.userName || '').toLowerCase().includes(q);
        const matchAction = (log.action || '').toLowerCase().includes(q);
        const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
        if (!matchName && !matchAction && !matchDetails) return false;
      }
      if (filterAction && log.action !== filterAction) return false;
      if (filterEntity && log.entity !== filterEntity) return false;
      if (dateFrom || dateTo) {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        if (!logDate) return false;
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (logDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery, filterAction, filterEntity, dateFrom, dateTo]);

  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const uniqueEntities = useMemo(() => [...new Set(logs.map((l) => l.entity))].sort(), [logs]);

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/admin/audit" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Audit Log</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
                <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {/* Filters */}
          <Card className="p-5 bg-card border-border">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-card-foreground">Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, action, details..."
                  className="w-full h-10 rounded-xl border-2 border-border/50 bg-white/80 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/40"
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-10 rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">All Actions</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
                ))}
              </select>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="h-10 rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">All Entities</option>
                {uniqueEntities.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From date"
                className="h-10 rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To date"
                className="h-10 rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredLogs.length} of {logs.length} entries {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-2 text-primary hover:underline">Clear dates</button>}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  const header = ['Timestamp', 'User', 'Action', 'Entity', 'Details'];
                  const rows = filteredLogs.map((l) => [
                    l.timestamp || '',
                    l.userName || '',
                    ACTION_LABELS[l.action] || l.action,
                    l.entity || '',
                    formatDetails(l.action, l.details) || '',
                  ]);
                  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button onClick={loadLogs} className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          </Card>

          {/* Log entries */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading audit logs...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card className="p-12 bg-card border-border text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {logs.length === 0 ? 'No audit logs yet. Actions will appear here as users interact with the system.' : 'No logs match your filters.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const IconComp = ENTITY_ICONS[log.entity] || FileText;
                const colorClass = ACTION_COLORS[log.action] || 'bg-gray-500/10 text-gray-600';
                const detailText = formatDetails(log.action, log.details);
                return (
                  <Card key={log.id} className="p-4 bg-card border-border hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${colorClass}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-card-foreground">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{log.userName || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground" title={log.timestamp}>{formatTimestamp(log.timestamp)}</span>
                        </div>
                        {detailText && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{detailText}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${colorClass}`}>
                        {log.entity}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
