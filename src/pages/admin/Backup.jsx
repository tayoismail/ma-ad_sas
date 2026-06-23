import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Upload, Menu, CheckCircle2,
  AlertCircle, Loader2, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { collection, getDocs, deleteDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/ui/card';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import ConfirmModal from '../../components/ConfirmModal';

const COLLECTIONS = ['users', 'settings', 'classes', 'students', 'subjects', 'results', 'promotions', 'attendance'];

export default function BackupPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState('');
  const [rollbackData, setRollbackData] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = {};
      for (const name of COLLECTIONS) {
        const snap = await getDocs(collection(db, name));
        data[name] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
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

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreConfirm(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!restoreConfirm) return;
    setImporting(true);
    setRestoreConfirm(null);
    setRestoreProgress('Backing up current data...');
    let backup = null;
    try {
      backup = {};
      for (const name of COLLECTIONS) {
        const snap = await getDocs(collection(db, name));
        backup[name] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      }
      setRollbackData(backup);
    } catch {
      setRollbackData(null);
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        for (const name of COLLECTIONS) {
          setRestoreProgress(`Restoring ${name}...`);
          const snap = await getDocs(collection(db, name));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, name, d.id));
          }
          if (data[name]?.length) {
            for (const item of data[name]) {
              const { _id, ...rest } = item;
              await setDoc(doc(db, name, _id), rest);
            }
          }
        }
        setRestoreProgress('');
        setResult({ type: 'success', message: 'Data restored successfully! Please refresh the page.' });
      } catch {
        setRestoreProgress('');
        setResult({ type: 'error', message: 'Restore failed. Rolling back to previous data...' });
        if (rollbackData) {
          try {
            for (const name of COLLECTIONS) {
              const snap = await getDocs(collection(db, name));
              for (const d of snap.docs) { await deleteDoc(doc(db, name, d.id)); }
              if (rollbackData[name]?.length) {
                for (const item of rollbackData[name]) {
                  const { _id, ...rest } = item;
                  await setDoc(doc(db, name, _id), rest);
                }
              }
            }
            setResult({ type: 'success', message: 'Restore failed but data was rolled back successfully. No data was lost.' });
          } catch {
            setResult({ type: 'error', message: 'CRITICAL: Restore failed and rollback also failed. Please restore from a manual backup.' });
          }
        }
      }
      setRollbackData(null);
      setImporting(false);
    };
    reader.readAsText(restoreConfirm);
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />
      <AdminSidebar activePath="/admin/backup" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Data Backup & Restore</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
              <span className="text-sm text-gray-600">{importing ? restoreProgress || 'Restoring...' : 'Choose backup file'}</span>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelected} disabled={importing} />
            </label>
          </Card>
        </main>
      </div>
      <ConfirmModal
        open={restoreConfirm !== null}
        title="Restore Data?"
        message="This will OVERWRITE all existing data including all students, results, attendance, and settings. This action cannot be undone. Are you sure?"
        confirmLabel="Yes, Restore Everything"
        variant="danger"
        loading={importing}
        onConfirm={handleImport}
        onCancel={() => { setRestoreConfirm(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
      />
    </div>
  );
}
