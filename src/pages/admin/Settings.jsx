import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, School,
  Calendar, Layers, Loader2, CheckCircle2,
  AlertCircle, Bell, Menu,
  Lock, Unlock, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import ConfirmModal from '../../components/ConfirmModal';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { semesterLabel } from '../../lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    schoolName: '',
    address: '',
    phones: '',
    mission: '',
    currentSession: '',
    currentSemester: 1,
    useAttendanceUpgrade: false,
    semestersFinalized: {},
    gradingScale: [],
  });
  const [finalizeConfirm, setFinalizeConfirm] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        schoolName: settings.schoolName || '',
        address: settings.address || '',
        phones: settings.phones || '',
        mission: settings.mission || '',
        currentSession: settings.currentSession || '',
        currentSemester: settings.currentSemester || 1,
        useAttendanceUpgrade: settings.useAttendanceUpgrade || false,
        semestersFinalized: settings.semestersFinalized || {},
        gradingScale: settings.gradingScale || [],
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const scale = form.gradingScale;
    for (let i = 0; i < scale.length; i++) {
      if (scale[i].min > scale[i].max) {
        setError(`Grade ${scale[i].grade}: min cannot be greater than max`);
        setSaving(false); return;
      }
      if (i > 0 && scale[i].min !== scale[i - 1].max + 1) {
        setError(`Grading scale has a gap between ${scale[i - 1].grade} (max ${scale[i - 1].max}) and ${scale[i].grade} (min ${scale[i].min})`);
        setSaving(false); return;
      }
    }
    if (scale.length > 0 && (scale[0].min !== 0 || scale[scale.length - 1].max !== 100)) {
      setError('Grading scale must cover the full range 0-100');
      setSaving(false); return;
    }
    try {
      await updateSettings(form);
    } catch {
      setError('Failed to save settings');
      setSaving(false); return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFinalize = async (semester) => {
    setFinalizing(true);
    try {
      const finalized = { ...form.semestersFinalized, [`${form.currentSession}_sem${semester}`]: true };
      const updated = { ...form, semestersFinalized: finalized };
      await updateSettings(updated);
      setForm(updated);
    } catch {
      setError('Failed to finalize semester');
    }
    setFinalizing(false);
    setFinalizeConfirm(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isSemesterFinalized = (sem) => form.semestersFinalized?.[`${form.currentSession}_sem${sem}`];

  const updateGrade = (index, field, value) => {
    const scale = [...form.gradingScale];
    scale[index] = { ...scale[index], [field]: value };
    setForm({ ...form, gradingScale: scale });
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/settings" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-card-foreground">School Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 text-muted-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-card-foreground">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6 max-w-4xl">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully
            </div>
          )}

          {/* School Info */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <School className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">School Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                <Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} className="bg-white/80" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 py-3 text-sm shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/10 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Numbers</label>
                <Input value={form.phones} onChange={(e) => setForm({ ...form, phones: e.target.value })} className="bg-white/80" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mission Statement</label>
                <Input value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} className="bg-white/80" />
              </div>
            </div>
          </Card>

          {/* Academic Session */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Academic Session</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Session</label>
                <Input
                  value={form.currentSession}
                  onChange={(e) => setForm({ ...form, currentSession: e.target.value })}
                  placeholder="e.g. 2024/2025"
                  className="bg-white/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Semester</label>
                <div className="flex gap-2">
                  {[1, 2].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setForm({ ...form, currentSemester: sem })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        form.currentSemester === sem
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                          : 'bg-white/80 border-2 border-border/50 text-gray-600 hover:border-amber-500/30'
                      }`}
                    >
                      {semesterLabel(sem)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Attendance Upgrade */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10"><Calendar className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Attendance Upgrade</h2>
                <p className="text-xs text-gray-400">Automatically add 2 points to final score for students with 90%+ attendance</p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useAttendanceUpgrade || false}
                onChange={(e) => setForm({ ...form, useAttendanceUpgrade: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Attendance Upgrade</p>
                <p className="text-xs text-gray-400">Students with ≥90% attendance get +2 points (capped at 100)</p>
              </div>
            </label>
          </Card>

          {/* Finalize Semester */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10"><Lock className="w-5 h-5 text-red-500" /></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Finalize Semester</h2>
                <p className="text-xs text-gray-400">Once finalized, no more edits can be made to results for that semester.</p>
              </div>
            </div>
            <div className="flex gap-3">
              {[1, 2].map((sem) => {
                const finalized = isSemesterFinalized(sem);
                return (
                  <div key={sem} className={`flex-1 p-4 rounded-xl ${finalized ? 'bg-gray-100/50 border border-emerald-200' : 'bg-amber-50/50 border border-amber-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{semesterLabel(sem)}</span>
                      {finalized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600"><Lock className="w-3 h-3" /> Finalized</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600"><Unlock className="w-3 h-3" /> Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{finalized ? 'Results are locked.' : 'Results can still be edited.'}</p>
                    {!finalized && (
                      <Button size="sm" variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setFinalizeConfirm(sem)}>
                        <Lock className="w-3.5 h-3.5 mr-1" /> إنهاء {semesterLabel(sem)}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Theme Toggle */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10">{theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
                  <p className="text-xs text-gray-400">Switch between light and dark mode</p>
                </div>
              </div>
              <button onClick={toggleTheme} className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'}`}>
                  {theme === 'dark' ? <Moon className="w-3 h-3 text-indigo-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
                </div>
              </button>
            </div>
          </Card>

          {/* Grading Scale */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Layers className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Grading Scale</h2>
            </div>
            <div className="space-y-3">
              {form.gradingScale.map((grade, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/50 border border-white/20">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{
                      background: grade.grade === 'A' ? 'linear-gradient(135deg, #22c55e20, #16a34a20)' :
                                  grade.grade === 'B' ? 'linear-gradient(135deg, #3b82f620, #2563eb20)' :
                                  grade.grade === 'C' ? 'linear-gradient(135deg, #eab30820, #ca8a0420)' :
                                  grade.grade === 'D' ? 'linear-gradient(135deg, #f9731620, #ea580c20)' :
                                  'linear-gradient(135deg, #ef444420, #dc262620)',
                      color: grade.grade === 'A' ? '#16a34a' :
                             grade.grade === 'B' ? '#2563eb' :
                             grade.grade === 'C' ? '#ca8a04' :
                             grade.grade === 'D' ? '#ea580c' : '#dc2626',
                    }}
                  >
                    {grade.grade}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Input
                      type="number"
                      value={grade.min}
                      onChange={(e) => updateGrade(i, 'min', Number(e.target.value))}
                      className="w-16 h-9 text-center bg-white/80"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      value={grade.max}
                      onChange={(e) => updateGrade(i, 'max', Number(e.target.value))}
                      className="w-16 h-9 text-center bg-white/80"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Input
                      value={grade.remarkEn}
                      onChange={(e) => updateGrade(i, 'remarkEn', e.target.value)}
                      className="h-9 bg-white/80 text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[80px] text-right">
                    <Input
                      value={grade.remarkAr}
                      onChange={(e) => updateGrade(i, 'remarkAr', e.target.value)}
                      className="h-9 bg-white/80 text-sm text-right"
                      dir="rtl"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Save */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>Cancel</Button>
            <Button className="gradient-accent text-white border-0 min-w-[140px]" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={finalizeConfirm !== null}
        title="Finalize Semester?"
        message={`This will lock all results for ${form.currentSession} ${semesterLabel(finalizeConfirm)}. No further edits will be allowed. This action cannot be undone.`}
        confirmLabel="Finalize"
        variant="warning"
        loading={finalizing}
        onConfirm={() => handleFinalize(finalizeConfirm)}
        onCancel={() => setFinalizeConfirm(null)}
      />
    </div>
  );
}
