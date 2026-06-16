import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, Menu, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, UserCheck, UserX, Printer, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import usePromotionStore from '../../store/promotionStore';
import useClassesStore from '../../store/classesStore';
import ConfirmModal from '../../components/ConfirmModal';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { gradeStyle } from '../../lib/grading';
import AdminSidebar from '../../components/AdminSidebar';

export default function PromotionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { cumulativeData, promotions, loadPromotions, calculateCumulative, confirmPromotion, confirmAll } = usePromotionStore();
  const { loadClasses } = useClassesStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const confirmed = (studentId) => promotions.find((p) => p.studentId === studentId && p.status === 'confirmed');

  const promoted = cumulativeData.filter((d) => d.shouldPromote);
  const repeating = cumulativeData.filter((d) => !d.shouldPromote && d.cumulative !== null);
  const noData = cumulativeData.filter((d) => d.cumulative === null);

  const handlePrint = () => {
    const grouped = {};
    promoted.forEach((d) => {
      if (!grouped[d.className]) grouped[d.className] = [];
      grouped[d.className].push(d);
    });
    let tablesHtml = '';
    Object.entries(grouped).forEach(([className, students]) => {
      const rows = students.map((d, i) => {
        const gs = gradeStyle(d.grade);
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px;color:#666;">${i + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px;font-weight:600;">${d.studentName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px;text-align:center;font-weight:600;">${d.cumulative}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px;text-align:center;">
            <span style="padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${gs.hex}20;color:${gs.hex};">${d.grade}</span>
          </td>
        </tr>
      `;
      }).join('');
      tablesHtml += `
        <div style="margin-bottom:24px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;padding-bottom:4px;border-bottom:2px solid #333;">
            ${className} → ${students[0]?.promoteTo || '--'}
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f3f4f6;border-top:2px solid #d1d5db;border-bottom:2px solid #d1d5db;">
                <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;">#</th>
                <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;">Student</th>
                <th style="text-align:center;padding:8px 12px;font-size:11px;text-transform:uppercase;">Cumulative</th>
                <th style="text-align:center;padding:8px 12px;font-size:11px;text-transform:uppercase;">Grade</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });

    const html = `<!DOCTYPE html>
<html><head><title>Promotion List</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: auto; color: #111; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:22px;margin:0;">${settings?.schoolName || "MA'AD AHLIL AATHAR"}</h1>
    <p style="font-size:13px;color:#666;margin:4px 0 0;">Session: ${settings?.currentSession || '--'}</p>
    <h2 style="font-size:18px;margin:16px 0 4px;">Promotion List</h2>
    <p style="font-size:12px;color:#999;">Students promoted to the next class</p>
  </div>
  ${tablesHtml}
  <div style="text-align:center;font-size:11px;color:#999;margin-top:32px;padding-top:16px;border-top:1px solid #ddd;">
    Generated ${new Date().toLocaleDateString()} by ${settings?.schoolName || "MA'AD AHLIL AATHAR"} Assessment System
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  useEffect(() => {
    loadSettings();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings) {
      loadPromotions(settings.currentSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleCalculate = async () => {
    setCalcLoading(true);
    try {
      await calculateCumulative(settings?.currentSession || '2024/2025');
      setCalculated(true);
    } catch (err) {
      console.error('Failed to calculate cumulative:', err);
    }
    setCalcLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/admin/promotion" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Promotion / End Session</h1>
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

        <main className="p-4 lg:p-8 space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Session: {settings?.currentSession || '--'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Calculate cumulative averages and process promotions</p>
              </div>
              {user?.role !== 'teacher' && (
                <Button onClick={handleCalculate} disabled={calcLoading} className="gradient-accent text-white border-0 shadow-lg shadow-purple-500/20">
                  {calcLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {calcLoading ? 'Calculating...' : 'Calculate Cumulative'}
                </Button>
              )}
            </div>
          </Card>

          {calculated && cumulativeData.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10"><UserCheck className="w-5 h-5 text-emerald-500" /></div>
                    <div><p className="text-sm text-gray-500">Promote</p><p className="text-2xl font-bold text-gray-900">{promoted.length}</p></div>
                  </div>
                </Card>
                <Card className="p-5 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10"><UserX className="w-5 h-5 text-red-500" /></div>
                    <div><p className="text-sm text-gray-500">Repeat</p><p className="text-2xl font-bold text-gray-900">{repeating.length}</p></div>
                  </div>
                </Card>
                <Card className="p-5 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-100"><AlertCircle className="w-5 h-5 text-gray-500" /></div>
                    <div><p className="text-sm text-gray-500">No Data</p><p className="text-2xl font-bold text-gray-900">{noData.length}</p></div>
                  </div>
                </Card>
              </div>

              {promoted.length > 0 && (
                <Card className="overflow-hidden bg-card border-border">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-500" /> Promote ({promoted.length})</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-1" /> Print
                      </Button>
                      <Button size="sm" onClick={() => setConfirmAllOpen(true)} className="gradient-accent text-white border-0">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Confirm All
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white/40 border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">To</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cumulative</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr></thead>
                      <tbody>
                        {promoted.map((d) => (
                          <tr key={d.studentId} className="border-b border-white/10 hover:bg-white/30">
                            <td className="px-4 py-3 font-medium text-gray-900">{d.studentName}</td>
                            <td className="px-4 py-3 text-gray-500">{d.className}</td>
                            <td className="px-4 py-3 text-emerald-600 font-medium">{d.promoteTo}</td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-900">{d.cumulative}</td>
                            <td className="px-4 py-3 text-center">
                              {(() => { const s = gradeStyle(d.grade); return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{d.grade}</span>; })()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {confirmed(d.studentId) ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Done</span>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => confirmPromotion(d.studentId, settings?.currentSession)}>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Promote
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {repeating.length > 0 && (
                <Card className="overflow-hidden bg-card border-border">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><UserX className="w-4 h-4 text-red-500" /> Repeating ({repeating.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white/40 border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cumulative</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr></thead>
                      <tbody>
                        {repeating.map((d) => (
                          <tr key={d.studentId} className="border-b border-white/10 hover:bg-white/30">
                            <td className="px-4 py-3 font-medium text-gray-900">{d.studentName}</td>
                            <td className="px-4 py-3 text-gray-500">{d.className}</td>
                            <td className="px-4 py-3 text-center font-semibold text-red-600">{d.cumulative}</td>
                            <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600">{d.grade}</span></td>
                            <td className="px-4 py-3 text-center">
                              {confirmed(d.studentId) ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Confirmed Repeat</span>
                              ) : (
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" onClick={() => confirmPromotion(d.studentId, settings?.currentSession)}>
                                  Confirm Repeat
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {calculated && cumulativeData.length === 0 && (
            <div className="text-center py-16">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No Results Found</h3>
              <p className="text-sm text-gray-400">Enter results first before calculating promotions</p>
            </div>
          )}
        </main>
      </div>

      <ConfirmModal
        open={confirmAllOpen}
        title="Confirm All Promotions?"
        message={`This will promote ${promoted.length} student(s) and confirm ${repeating.length} student(s) to repeat. This action updates student class assignments.`}
        confirmLabel={`Confirm All (${promoted.length + repeating.length})`}
        variant="warning"
        onConfirm={() => { confirmAll(settings?.currentSession); setConfirmAllOpen(false); }}
        onCancel={() => setConfirmAllOpen(false)}
      />
    </div>
  );
}
