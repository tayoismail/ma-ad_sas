import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, Menu,
  Search, FileText, Users, GraduationCap, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import useSubjectsStore from '../../store/subjectsStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { calculateGrade } from '../../lib/grading';
import { semesterLabel } from '../../lib/utils';
import AdminSidebar from '../../components/AdminSidebar';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings, loadSettings } = useSettingsStore();
  const { classes, loadClasses } = useClassesStore();
  const { students, loadStudents } = useStudentsStore();
  const { results, loadResults } = useResultsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const classReportRef = useRef(null);
  const studentReportRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('class');

  // Class result sheet filters
  const [classFilters, setClassFilters] = useState({
    session: '2024/2025',
    semester: '1',
    className: '',
  });
  const [classGenerated, setClassGenerated] = useState(false);

  // Student report card filters
  const [studentFilters, setStudentFilters] = useState({
    session: '2024/2025',
    semester: '1',
    className: '',
    studentId: '',
  });
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadStudents();
    loadResults();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings) {
      const s = settings.currentSession;
      const sem = String(settings.currentSemester);
      /* eslint-disable react-hooks/set-state-in-effect */
      setClassFilters((f) => ({ ...f, session: s, semester: sem }));
      setStudentFilters((f) => ({ ...f, session: s, semester: sem }));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [settings]);

  const filteredStudents = students.filter((s) => s.className === studentFilters.className);

  // Class result sheet data
  const classStudents = students.filter((s) => s.className === classFilters.className);
  const classResults = results.filter(
    (r) => r.className === classFilters.className && r.session === classFilters.session && r.semester === Number(classFilters.semester)
  );
  const classSubjects = [...new Set(classResults.map((r) => r.subjectName))];
  const totalClassSubjects = subjects.filter((s) => s.className === classFilters.className).length;

  const studentRows = classStudents.map((s) => {
    const sResults = classResults.filter((r) => r.studentId === s.studentId);
    const subjectScores = classSubjects.map((subj) => sResults.find((r) => r.subjectName === subj));
    const total = sResults.reduce((sum, r) => sum + (r.total || 0), 0);
    const denom = totalClassSubjects || sResults.length;
    const avg = denom ? Math.round((total / denom) * 100) / 100 : null;
    return { student: s, subjectScores, total, avg };
  });

  // Student report card data
  const selectedStudent = students.find((s) => String(s.studentId) === String(studentFilters.studentId));
  const totalStudentSubjects = subjects.filter((s) => s.className === selectedStudent?.className).length;
  const studentReportResults = results.filter(
    (r) => String(r.studentId) === String(studentFilters.studentId) && r.session === studentFilters.session && r.semester === Number(studentFilters.semester)
  );

  const handleClassGenerate = () => {
    if (classFilters.className) setClassGenerated(true);
  };

  const handleStudentGenerate = () => {
    if (studentFilters.studentId) setReportGenerated(true);
  };

  const downloadPDF = async (ref, filename) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = ref.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 277;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 5, 10, imgWidth, imgHeight);
    pdf.save(filename);
  };

  const handlePrint = (ref) => {
    const el = ref.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((s) => s.outerHTML).join('\n');
    win.document.write(`<!DOCTYPE html><html><head><title>Print</title>${styles}</head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const gradeInfo = (total) => {
    const calc = calculateGrade(total, settings?.gradingScale);
    const colors = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-orange-600', F: 'text-red-600' };
    const bg = { A: 'bg-emerald-500/10', B: 'bg-blue-500/10', C: 'bg-amber-500/10', D: 'bg-orange-500/10', F: 'bg-red-500/10' };
    return { grade: calc.grade, remarkAr: calc.remarkAr, color: colors[calc.grade] || 'text-gray-600', bg: bg[calc.grade] || 'bg-gray-100' };
  };

  const promotionStatus = (avg) => {
    if (avg === null || avg === undefined) return null;
    const promoted = avg >= 50;
    return {
      status: promoted ? 'promoted' : 'repeat',
      en: promoted ? 'Promoted' : 'Repeat',
      ar: promoted ? 'منتقل' : 'راسب',
      color: promoted ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10',
    };
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/admin/reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Reports</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {activeTab === 'class' && classGenerated && (
                <div className="flex gap-2 max-sm:hidden">
                  <Button size="sm" variant="outline" onClick={() => handlePrint(classReportRef)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                  <Button size="sm" onClick={() => downloadPDF(classReportRef, `${classFilters.className}_semester_${classFilters.semester}_results.pdf`)} className="gradient-accent text-white border-0"><Download className="w-4 h-4 mr-1" /> PDF</Button>
                </div>
              )}
              {activeTab === 'student' && reportGenerated && (
                <div className="flex gap-2 max-sm:hidden">
                  <Button size="sm" variant="outline" onClick={() => handlePrint(studentReportRef)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                  <Button size="sm" onClick={() => downloadPDF(studentReportRef, `${selectedStudent?.name?.replace(/\s+/g, '_') || 'student'}_report_card.pdf`)} className="gradient-accent text-white border-0"><Download className="w-4 h-4 mr-1" /> PDF</Button>
                </div>
              )}
              <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-card rounded-xl p-1 border border-border max-w-md">
            <button
              onClick={() => setActiveTab('class')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'class' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
            >
              <Users className="w-4 h-4" /> Class Result Sheet
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'student' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
            >
              <FileText className="w-4 h-4" /> Student Report Card
            </button>
          </div>

          {/* Class Result Sheet */}
          {activeTab === 'class' && <>
            <Card className="p-5 bg-card border-border">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                  <input value={classFilters.session} onChange={(e) => setClassFilters({ ...classFilters, session: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                  <select value={classFilters.semester} onChange={(e) => setClassFilters({ ...classFilters, semester: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                    <option value="1">{semesterLabel(1)}</option><option value="2">{semesterLabel(2)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                  <select value={classFilters.className} onChange={(e) => setClassFilters({ ...classFilters, className: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleClassGenerate} disabled={!classFilters.className} className="w-full gradient-accent text-white border-0">
                    <Search className="w-4 h-4 mr-2" /> Generate
                  </Button>
                </div>
              </div>
            </Card>

            {classGenerated && <>
              <div className="flex gap-2 sm:hidden">
                <Button variant="outline" className="flex-1" onClick={() => handlePrint(classReportRef)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                <Button className="flex-1 gradient-accent text-white border-0" onClick={() => downloadPDF(classReportRef, `${classFilters.className}_semester_${classFilters.semester}_results.pdf`)}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              </div>

              <div ref={classReportRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                <div className="gradient-primary p-6 text-white text-center print:bg-gray-800 print:text-black">
                  <h1 className="text-xl font-bold">{settings?.schoolName || "MA'AD AHLIL AATHAR"}</h1>
                  <p className="text-white/70 text-xs mt-1">{settings?.address}</p>
                  <div className="w-16 h-0.5 bg-white/30 mx-auto my-3" />
                  <h2 className="text-lg font-semibold">Class Result Sheet</h2>
                  <p className="text-white/60 text-xs mt-1">{classFilters.className} — {classFilters.session} — {semesterLabel(classFilters.semester)}</p>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">#</th>
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Student</th>
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">ID</th>
                        {classSubjects.map((s) => (
                          <th key={s} className="text-center px-2 py-2.5 text-xs font-bold text-gray-700 uppercase min-w-[80px]">{s}</th>
                        ))}
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Total</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Avg</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Grade (الدرجة)</th>
                        {Number(classFilters.semester) === 2 && <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Status (الحالة)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {studentRows.length === 0 && (
                        <tr><td colSpan={6 + classSubjects.length + (Number(classFilters.semester) === 2 ? 1 : 0)} className="text-center py-8 text-gray-500">No results found for this class</td></tr>
                      )}
                      {studentRows.sort((a, b) => (b.avg || 0) - (a.avg || 0)).map((row, i) => {
                        const g = row.avg !== null ? gradeInfo(row.avg) : { grade: '--', color: '', bg: '', remarkAr: '' };
                        const promo = Number(classFilters.semester) === 2 ? promotionStatus(row.avg) : null;
                        return (
                          <tr key={row.student.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-500 text-xs">{i + 1}</td>
                            <td className="px-3 py-2.5 font-semibold text-gray-900">{row.student.name}</td>
                            <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{row.student.studentId || '--'}</td>
                            {classSubjects.map((subj) => {
                              const sr = row.subjectScores[classSubjects.indexOf(subj)];
                              return <td key={subj} className="px-2 py-2.5 text-center font-semibold text-gray-800">{sr?.total ?? '--'}</td>;
                            })}
                            <td className="px-3 py-2.5 text-center font-semibold text-gray-900">{row.total || 0}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-gray-900">{row.avg !== null ? row.avg : '--'}</td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${g.color} ${g.bg}`}>{g.grade}</span>
                                <span className="text-[10px] text-gray-500 font-medium" dir="rtl">{g.remarkAr}</span>
                              </div>
                            </td>
                            {promo && (
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${promo.color}`}>{promo.en}</span>
                                  <span className="text-[10px] font-medium" dir="rtl">{promo.ar}</span>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-200">
                  Generated {new Date().toLocaleDateString()} by MA'AD AHLIL AATHAR Assessment System
                </div>
              </div>
            </>}

            {!classGenerated && (
              <div className="text-center py-16">
                <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Class Result Sheet</h3>
                <p className="text-sm text-gray-500">Select a class and click Generate to view the result sheet</p>
              </div>
            )}
          </>}

          {/* Student Report Card */}
          {activeTab === 'student' && <>
            <Card className="p-5 bg-card border-border">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                  <input value={studentFilters.session} onChange={(e) => setStudentFilters({ ...studentFilters, session: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                  <select value={studentFilters.semester} onChange={(e) => setStudentFilters({ ...studentFilters, semester: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                    <option value="1">{semesterLabel(1)}</option><option value="2">{semesterLabel(2)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                  <select value={studentFilters.className} onChange={(e) => {
                    setStudentFilters({ ...studentFilters, className: e.target.value, studentId: '' });
                  }}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                  <select value={studentFilters.studentId} onChange={(e) => setStudentFilters({ ...studentFilters, studentId: e.target.value })}
                    className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
                    disabled={!studentFilters.className}>
                    <option value="">Select Student</option>
                    {filteredStudents.map((s) => <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleStudentGenerate} disabled={!studentFilters.studentId} className="w-full gradient-accent text-white border-0">
                    <Search className="w-4 h-4 mr-2" /> Generate
                  </Button>
                </div>
              </div>
            </Card>

            {reportGenerated && <>
              <div className="flex gap-2 sm:hidden">
                <Button variant="outline" className="flex-1" onClick={() => handlePrint(studentReportRef)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                <Button className="flex-1 gradient-accent text-white border-0" onClick={() => downloadPDF(studentReportRef, `${selectedStudent?.name?.replace(/\s+/g, '_') || 'student'}_report_card.pdf`)}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              </div>

              <div ref={studentReportRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                {/* Header */}
                <div className="gradient-primary p-6 text-white text-center print:bg-gray-800 print:text-black relative">
                  <div className="absolute top-4 left-4 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                    <GraduationCap className="w-7 h-7 text-white/80" />
                  </div>
                  <h1 className="text-xl font-bold">{settings?.schoolName || "MA'AD AHLIL AATHAR"}</h1>
                  <p className="text-white/70 text-xs mt-1">{settings?.address}</p>
                  <p className="text-white/60 text-xs">{settings?.phones}</p>
                  <div className="w-16 h-0.5 bg-white/30 mx-auto my-3" />
                  <h2 className="text-lg font-semibold">Student Report Card</h2>
                  <p className="text-white/60 text-xs mt-1">{studentFilters.session} — {semesterLabel(studentFilters.semester)}</p>
                </div>

                {/* Student Info */}
                {selectedStudent && (
                  <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Student Name</p><p className="text-sm font-semibold text-gray-900">{selectedStudent.name}</p></div>
                      <div dir="rtl"><p className="text-[10px] text-gray-400 uppercase tracking-wider">الاسم</p><p className="text-base font-semibold text-gray-900">{selectedStudent.arabicName || '--'}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Student ID</p><p className="text-sm font-semibold text-gray-900">{selectedStudent.studentId}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Class</p><p className="text-sm font-semibold text-gray-900">{selectedStudent.className}</p></div>
                    </div>
                  </div>
                )}

                {/* Results Table */}
                <div className="p-5 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">#</th>
                        <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Subject</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Exam Score</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">CA Score</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Total</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Grade</th>
                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-700 uppercase">Remark (الوصف)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReportResults.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">No results found for this student in the selected semester</td></tr>
                      )}
                      {studentReportResults.sort((a, b) => a.subjectName?.localeCompare(b.subjectName)).map((r, i) => {
                        const g = gradeInfo(r.total || 0);
                        const calc = calculateGrade(r.total || 0, settings?.gradingScale);
                        return (
                          <tr key={r.id || i} className="border-b border-gray-200">
                            <td className="px-3 py-2.5 text-gray-500 text-xs">{i + 1}</td>
                            <td className="px-3 py-2.5 font-semibold text-gray-900">{r.subjectName}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-gray-800">{r.examScore ?? '--'}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-gray-800">{r.testScore ?? '--'}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-gray-900">{r.total ?? '--'}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${g.color} ${g.bg}`}>{r.grade || g.grade}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700" dir="rtl">{calc?.remarkAr || '--'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                {studentReportResults.length > 0 && (
                  <div className="px-5 pb-5">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Semester Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const total = studentReportResults.reduce((s, r) => s + (r.total || 0), 0);
                          const denom = totalStudentSubjects || studentReportResults.length;
                          const avg = Math.round((total / denom) * 100) / 100;
                          const g = gradeInfo(avg);
                          const calc = calculateGrade(avg, settings?.gradingScale);
                          return <>
                            <div className="text-center p-3 rounded-lg bg-white/60">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subjects</p>
                              <p className="text-lg font-bold text-gray-900">{studentReportResults.length}</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/60">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Score</p>
                              <p className="text-lg font-bold text-gray-900">{total}</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/60">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Average</p>
                              <p className={`text-lg font-bold ${g.color}`}>{avg}</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/60">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Grade / التقدير</p>
                              <p className={`text-lg font-bold ${g.color}`}>{g.grade} — <span dir="rtl">{calc?.remarkAr || '--'}</span></p>
                            </div>
                            {Number(studentFilters.semester) === 2 && (() => {
                              const p = promotionStatus(avg);
                              return p ? (
                                <div className="text-center p-3 rounded-lg bg-white/60">
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status / الحالة</p>
                                  <p className={`text-lg font-bold ${p.color}`}>{p.en} / <span dir="rtl">{p.ar}</span></p>
                                </div>
                              ) : null;
                            })()}
                          </>;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Signatures */}
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="h-12 mb-2 border-b border-gray-300" />
                      <p className="text-xs font-semibold text-gray-600">Class Teacher</p>
                      <p className="text-xs text-gray-500">Signature & Date</p>
                    </div>
                    <div className="text-center">
                      <div className="h-12 mb-2 border-b border-gray-300" />
                      <p className="text-xs font-semibold text-gray-600">Principal</p>
                      <p className="text-xs text-gray-500">Signature & Date</p>
                    </div>
                    <div className="text-center">
                      <div className="h-12 mb-2 border-b border-gray-300" />
                      <p className="text-xs font-semibold text-gray-600">School Stamp</p>
                      <p className="text-xs text-gray-500">Official Seal</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-200">
                  Generated {new Date().toLocaleDateString()} by MA'AD AHLIL AATHAR Assessment System
                </div>
              </div>
            </>}

            {!reportGenerated && (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Student Report Card</h3>
                <p className="text-sm text-gray-500">Select a student and click Generate to view the report card</p>
              </div>
            )}
          </>}
        </main>
      </div>
    </div>
  );
}
