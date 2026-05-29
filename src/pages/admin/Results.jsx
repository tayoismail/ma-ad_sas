import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Upload, Award,
  Menu, Loader2, CheckCircle2, AlertCircle,
  X, Download, FileSpreadsheet, Lock, Users
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useSubjectsStore from '../../store/subjectsStore';
import useResultsStore from '../../store/resultsStore';
import { calculateGrade, calculateTotal } from '../../lib/grading';
import { semesterLabel } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import AdminSidebar from '../../components/AdminSidebar';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classes, loadClasses, loading: classesLoading } = useClassesStore();
  const { subjects, loadSubjects, loading: subjectsLoading } = useSubjectsStore();
  const { students, loadStudents, loading: studentsLoading } = useStudentsStore();
  const { getResultsForClass, saveResult, saveResults } = useResultsStore();
  const { settings, loadSettings } = useSettingsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    session: settings?.currentSession || '2024/2025',
    semester: String(settings?.currentSemester || 1),
    className: '',
    subjectId: '',
  });
  const [scores, setScores] = useState({});
  const [, setExistingResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useTest, setUseTest] = useState(false);
  const [useAttendance, setUseAttendance] = useState(false);

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadSubjects();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (settings) {
      setFilters((f) => ({ ...f, session: settings.currentSession, semester: String(settings.currentSemester) }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  const isTeacher = user?.role === 'teacher';
  const teacherSubjectIds = isTeacher ? (user?.teacherSubjects ?? null) : null;
  const filteredSubjects = subjects.filter((s) => s.className === filters.className && (!teacherSubjectIds || teacherSubjectIds.includes(s.id)));
  const filteredClasses = useMemo(() => {
    if (!isTeacher || !teacherSubjectIds) return classes;
    const names = [...new Set(subjects.filter((s) => teacherSubjectIds.includes(s.id)).map((s) => s.className))];
    return classes.filter((c) => names.includes(c.name));
  }, [classes, subjects, teacherSubjectIds, isTeacher]);
  const classStudents = students.filter((s) => s.className === filters.className);
  const isFinalized = settings?.semestersFinalized?.[`${filters.session}_sem${filters.semester}`];

  const handleLoadResults = async () => {
    if (!filters.className || !filters.subjectId) return;
    const results = await getResultsForClass(filters.className, filters.session, filters.semester, filters.subjectId);
    setExistingResults(results);
    const map = {};
    results.forEach((r) => {
      map[r.studentId] = {
        examScore: r.examScore ?? '',
        testScore: r.testScore ?? '',
        attendance: r.attendance ?? '',
      };
    });
    setScores(map);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (filters.className && filters.subjectId) handleLoadResults();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.className, filters.subjectId]);

  const updateScore = (studentId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSaveAll = async () => {
    setError('');
    for (const student of classStudents) {
      const s = scores[student.studentId] || {};
      const exam = Number(s.examScore) || 0;
      const test = useTest ? (Number(s.testScore) || 0) : 0;
      if (exam > 100) { setError('Exam score cannot exceed 100'); setSaving(false); return; }
      if (test > 40) { setError('Test score cannot exceed 40'); setSaving(false); return; }
      if (useAttendance && (Number(s.attendance) || 0) > 100) { setError('Attendance cannot exceed 100%'); setSaving(false); return; }
    }
    setSaving(true);
    const subj = subjects.find((s) => s.id === Number(filters.subjectId));
    const scale = settings?.gradingScale;
    for (const student of classStudents) {
      const s = scores[student.studentId] || {};
      const examScore = Number(s.examScore) || 0;
      const testScore = useTest ? (Number(s.testScore) || 0) : 0;
      const total = calculateTotal(examScore, testScore);
      const gradeInfo = calculateGrade(total, scale);
      await saveResult({
        studentId: student.studentId,
        studentName: student.name,
        subjectId: Number(filters.subjectId),
        subjectName: subj?.name || '',
        className: filters.className,
        session: filters.session,
        semester: Number(filters.semester),
        examScore,
        testScore: useTest ? testScore : null,
        attendance: useAttendance ? (Number(s.attendance) || null) : null,
        total,
        ...gradeInfo,
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const mapped = json.map((r) => ({
        studentId: String(r.student_id || r.Student_ID || r.id || ''),
        subjectId: Number(r.subject_id || r.Subject_ID || 0),
        studentName: r.student_name || r.Student_Name || '',
        subjectName: r.subject_name || r.Subject_Name || '',
        className: r.class || r.Class || r.class_name || r.Class_Name || '',
        session: r.session || r.Session || filters.session,
        semester: Number(r.semester || r.Semester || filters.semester),
        examScore: Number(r.exam_score || r.Exam_Score || 0),
        testScore: r.test_score || r.Test_Score ? Number(r.test_score || r.Test_Score) : null,
        attendance: r.attendance || r.Attendance ? Number(r.attendance || r.Attendance) : null,
      }));
      setUploadData(mapped.filter((r) => r.studentId && (r.subjectId || r.subjectName)));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleMassUpload = async () => {
    setError('');
    const invalidRows = uploadData.filter((r) => !students.find((s) => s.studentId === r.studentId));
    if (invalidRows.length > 0) {
      setError(`${invalidRows.length} record(s) have unknown student IDs. Please check your data.`);
      setUploading(false);
      return;
    }
    const noSubject = uploadData.filter((r) => {
      if (r.subjectId) return false;
      return !subjects.find((s) => s.name === r.subjectName && s.className === r.className);
    });
    if (noSubject.length > 0) {
      setError(`${noSubject.length} record(s) have unknown subjects. Check subject_name and class.`);
      setUploading(false);
      return;
    }
    setUploading(true);
    const enriched = uploadData.map((r) => {
      const student = students.find((s) => s.studentId === r.studentId);
      let subj = subjects.find((s) => s.id === r.subjectId);
      if (!subj && r.subjectName) {
        subj = subjects.find((s) => s.name === r.subjectName && s.className === r.className);
        if (subj) r.subjectId = subj.id;
      }
      const exam = r.examScore || 0;
      const test = r.testScore || 0;
      const total = calculateTotal(exam, test);
      const gradeInfo = calculateGrade(total, settings?.gradingScale);
      return {
        ...r,
        studentName: student?.name || '',
        subjectName: subj?.name || '',
        className: student?.className || '',
        total,
        ...gradeInfo,
      };
    });
    const count = await saveResults(enriched);
    setUploadResult(count);
    setUploading(false);
    setUploadData([]);
    if (filters.className && filters.subjectId) handleLoadResults();
    setTimeout(() => setUploadResult(null), 5000);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      { student_id: 'STU001', student_name: 'John Doe', subject_name: 'Arabic', class: 'SS1A', session: '2024/2025', semester: '1', exam_score: '75', test_score: '30', attendance: '90' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'results_upload_template.xlsx');
  };

  const gradeBadge = (total) => {
    const g = calculateGrade(total, settings?.gradingScale);
    const colors = { A: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', B: 'bg-blue-500/10 text-blue-600 border-blue-200', C: 'bg-amber-500/10 text-amber-600 border-amber-200', D: 'bg-orange-500/10 text-orange-600 border-orange-200', F: 'bg-red-500/10 text-red-600 border-red-200' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[g.grade] || colors.F}`}>{g.grade}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/results" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Results</h1>
            </div>
            <div className="flex items-center gap-3">
              {user?.role !== 'teacher' && (
                <Button variant="outline" size="sm" onClick={() => setShowMassUpload(!showMassUpload)}><Upload className="w-4 h-4 mr-1" /> Mass Upload</Button>
              )}
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
                <Avatar className="ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {(classesLoading || subjectsLoading || studentsLoading) && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading data...</p>
              </div>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Results saved successfully
            </div>
          )}

          {uploadResult && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> {uploadResult} results imported
            </div>
          )}

          {/* Mass Upload */}
          {showMassUpload && user?.role !== 'teacher' && (
            <Card className="p-6 bg-card border-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold text-gray-900">Mass Upload Results</h3></div>
                <button onClick={() => { setShowMassUpload(false); setUploadData([]); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Upload CSV/Excel with columns: student_id, student_name, subject_name, class, session, semester, exam_score, test_score, attendance</p>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-1" /> Download Template
                </Button>
              </div>
              <label className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 bg-white/30 hover:bg-white/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-primary" /><span className="text-sm text-gray-600">Choose file</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </label>
              {uploadData.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-600">{uploadData.length} records parsed</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setUploadData([])}>Cancel</Button>
                    <Button onClick={handleMassUpload} disabled={uploading} className="gradient-accent text-white border-0">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Import {uploadData.length}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Filters */}
          <Card className="p-5 bg-card border-border">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                <Input value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })} className="bg-white/80 h-10" />
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
                <select value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value, subjectId: '' })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40">
                  <option value="">Select Class</option>
                   {filteredClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                  className="flex h-10 w-full rounded-xl border-2 border-border/50 bg-white/80 px-3 text-sm focus:outline-none focus:border-primary/40"
                  disabled={!filters.className}>
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name} {s.arabicName ? `(${s.arabicName})` : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={useTest} onChange={() => setUseTest(!useTest)} className="rounded border-gray-300" />
                Include Test Scores (max 40)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={useAttendance} onChange={() => setUseAttendance(!useAttendance)} className="rounded border-gray-300" />
                Include Attendance %
              </label>
            </div>
          </Card>

          {/* Score Entry */}
          {filters.className && filters.subjectId && (
            <Card className="overflow-hidden bg-card border-border">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">
                    {filters.className} — {subjects.find((s) => s.id === Number(filters.subjectId))?.name}
                  </h3>
                  <span className="text-xs text-gray-400">{semesterLabel(filters.semester)} · {filters.session}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{classStudents.length} students</span>
                  {isFinalized ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500"><Lock className="w-3.5 h-3.5" /> Finalized</span>
                  ) : (
                    <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gradient-accent text-white border-0">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save All
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/40 border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Exam (100)</th>
                      {useTest && <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Test (40)</th>}
                      {useAttendance && <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Attend %</th>}
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, i) => {
                      const s = scores[student.studentId] || {};
                      const exam = Number(s.examScore) || 0;
                      const test = useTest ? (Number(s.testScore) || 0) : 0;
                      const total = calculateTotal(exam, test);
                      return (
                        <tr key={student.id} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
                                {student.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-mono text-gray-400">{student.studentId || '--'}</td>
                          <td className="px-3 py-3">
                            <Input type="number" min={0} max={100} value={s.examScore ?? ''}
                              onChange={(e) => updateScore(student.studentId, 'examScore', e.target.value)}
                              disabled={isFinalized}
                              className="w-20 h-9 text-center bg-white/60 mx-auto text-sm" />
                          </td>
                          {useTest && (
                            <td className="px-3 py-3">
                              <Input type="number" min={0} max={40} value={s.testScore ?? ''}
                                onChange={(e) => updateScore(student.studentId, 'testScore', e.target.value)}
                                className="w-20 h-9 text-center bg-white/60 mx-auto text-sm" />
                            </td>
                          )}
                          {useAttendance && (
                            <td className="px-3 py-3">
                              <Input type="number" min={0} max={100} value={s.attendance ?? ''}
                                onChange={(e) => updateScore(student.studentId, 'attendance', e.target.value)}
                                className="w-20 h-9 text-center bg-white/60 mx-auto text-sm" />
                            </td>
                          )}
                          <td className="px-3 py-3 text-center font-semibold text-gray-900">{total}</td>
                          <td className="px-3 py-3 text-center">{gradeBadge(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {classStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No students in this class</p>
                </div>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
