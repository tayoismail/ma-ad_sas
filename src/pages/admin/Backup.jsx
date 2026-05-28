import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Upload, Bell, Menu, CheckCircle2,
  AlertCircle, Loader2
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import db from '../../db/database';
import { Card } from '../../components/ui/card';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function BackupPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const tables = ['users', 'settings', 'classes', 'students', 'subjects', 'results', 'cumulativeAverages', 'promotions'];

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = {};
      for (const table of tables) {
        data[table] = await db.table(table).toArray();
      }
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maad_sas_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResult({ type: 'success', message: 'Data exported successfully!' });
    } catch {
      setResult({ type: 'error', message: 'Export failed' });
    }
    setExporting(false);
    setTimeout(() => setResult(null), 5000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        for (const table of tables) {
          if (data[table]?.length) {
            await db.table(table).clear();
            await db.table(table).bulkAdd(data[table]);
          }
        }
        setResult({ type: 'success', message: 'Data restored successfully! Please refresh the page.' });
      } catch {
        setResult({ type: 'error', message: 'Invalid backup file' });
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />
      <AdminSidebar activePath="/admin/backup" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Data Backup & Restore</h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
              <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-2xl space-y-6">
          {result && (
            <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm animate-fade-in ${
              result.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
            }`}>
              {result.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10"><Download className="w-5 h-5 text-blue-500" /></div>
              <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Download all data as a JSON backup file. Includes all students, classes, subjects, results, and settings.</p>
            <Button onClick={handleExport} disabled={exporting} className="gradient-accent text-white border-0">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              {exporting ? 'Exporting...' : 'Export to JSON'}
            </Button>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10"><Upload className="w-5 h-5 text-amber-500" /></div>
              <h2 className="text-lg font-semibold text-gray-900">Restore Data</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Import from a previously exported JSON backup. This will OVERWRITE all existing data.</p>
            <label className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 bg-white/30 hover:bg-white/50 cursor-pointer transition-colors">
              {importing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Upload className="w-5 h-5 text-primary" />}
              <span className="text-sm text-gray-600">{importing ? 'Restoring...' : 'Choose backup file'}</span>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
          </Card>
        </main>
      </div>
    </div>
  );
}
