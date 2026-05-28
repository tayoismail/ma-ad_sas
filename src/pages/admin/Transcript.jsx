import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, BookOpen, School, Calendar, Award,
  FileText, GraduationCap, CheckCircle, AlertCircle
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useStudentsStore from '../../store/studentsStore';
import useResultsStore from '../../store/resultsStore';
import useSettingsStore from '../../store/settingsStore';
import useAttendanceStore from '../../store/attendanceStore';
import db from '../../db/database';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function calcAvg(results) {
  if (!results || results.length === 0) return null;
  const total = results.reduce((s, r) => s + (r.total || 0), 0);
  return Math.round((total / results.length) * 100) / 100;
}

function sortSessions(a, b) {
  return parseInt(a.split('/')[0]) - parseInt(b.split('/')[0]);
}

function gradeColor(grade) {
  const map = {
    A: 'text-emerald-700 bg-emerald-100',
    B: 'text-blue-700 bg-blue-100',
    C: 'text-amber-700 bg-amber-100',
    D: 'text-orange-700 bg-orange-100',
    F: 'text-red-700 bg-red-100',
  };
  return map[grade] || 'text-gray-700 bg-gray-100';
}

function statColor(val) {
  if (val === null || val === undefined) return 'text-gray-400';
  if (val >= 75) return 'text-emerald-600';
  if (val >= 60) return 'text-blue-600';
  if (val >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export default function TranscriptPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getStudent } = useStudentsStore();
  const { loadResultsByStudent } = useResultsStore();
  const { settings, loadSettings } = useSettingsStore();
  const { getAttendanceByStudent } = useAttendanceStore();
  const [student, setStudent] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [cumulativeRecords, setCumulativeRecords] = useState([]);
  const [promoRecords, setPromoRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const transcriptRef = useRef(null);

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const s = await getStudent(Number(id));
        setStudent(s);
        if (s) {
          const [r, a, cum, prom] = await Promise.all([
            loadResultsByStudent(s.studentId),
            getAttendanceByStudent(s.studentId),
            db.cumulativeAverages.where('studentId').equals(s.studentId).toArray(),
            db.promotions.where('studentId').equals(s.studentId).toArray(),
          ]);
          setAllResults(r);
          setAllAttendance(a);
          setCumulativeRecords(cum);
          setPromoRecords(prom);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load transcript:', err);
        setLoading(false);
      }
    })();
  }, [id]);

  const sessions = [...new Set(allResults.map((r) => r.session))].sort(sortSessions);

  const overallCum = (() => {
    const avgs = cumulativeRecords.map((c) => c.cumulative).filter(Boolean);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((s, v) => s + v, 0) / avgs.length) * 100) / 100;
  })();

  const calcAttendancePct = (studentId, session, semester) => {
    const records = allAttendance.filter((a) => a.studentId === studentId && a.session === session && a.semester === semester);
    if (records.length === 0) return null;
    const present = records.filter((r) => r.status === 'present').length;
    return Math.round((present / records.length) * 10000) / 100;
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = transcriptRef.current;
    if (!el) { setPdfLoading(false); return; }
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, windowHeight: el.scrollHeight });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }
    pdf.save(`${student?.name?.replace(/\s+/g, '_') || 'transcript'}_full_academic_record.pdf`);
    setPdfLoading(false);
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-300 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Student</h2>
          <p className="text-sm text-gray-500 mb-6">Select a student to view their complete academic record across all sessions.</p>
          <Button onClick={() => navigate('/admin/students')}>Go to Students List</Button>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen gradient-secondary flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const isGraduated = student?.className === 'Graduated' || (() => {
    const lastPromo = promoRecords[promoRecords.length - 1];
    return lastPromo?.status === 'graduated';
  })();

  return (
    <div className="min-h-screen bg-slate-300">
      <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-card-foreground">Full Academic Record</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={downloadPDF} disabled={pdfLoading} className="gradient-accent text-white border-0">
              {pdfLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div ref={transcriptRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden" dir="ltr">
          <div className="gradient-primary p-8 text-white text-center relative">
            <div className="absolute top-4 left-4 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
              <GraduationCap className="w-8 h-8 text-white/80" />
            </div>
            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
              <BookOpen className="w-8 h-8 text-white/80" />
            </div>
            <h1 className="text-2xl font-bold mb-1 tracking-wide">{settings?.schoolName || "MA'AD AHLIL AATHAR"}</h1>
            <p className="text-white/70 text-sm max-w-xl mx-auto">{settings?.address}</p>
            <p className="text-white/60 text-xs mt-1">{settings?.phones}</p>
            <div className="w-20 h-0.5 bg-white/30 mx-auto my-4" />
            <h2 className="text-lg font-semibold uppercase tracking-widest">Full Academic Record</h2>
            <p className="text-white/70 text-xs mt-1">Complete results from enrollment to present</p>
          </div>

          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Student Name</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.name}</p></div>
              <div dir="rtl"><p className="text-[10px] text-gray-400 uppercase tracking-wider">الاسم</p><p className="text-base font-semibold text-gray-900 mt-0.5">{student.arabicName || '--'}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Student ID</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.studentId || '--'}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Current Class</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.className}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Date of Birth</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.dateOfBirth || '--'}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Enrollment</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.enrollmentDate || '--'}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Parent</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.parentName || '--'}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{student.parentPhone || '--'}</p></div>
            </div>
          </div>

          {sessions.length === 0 && (
            <div className="p-12 text-center">
              <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No academic records found for this student.</p>
            </div>
          )}

          {sessions.map((session, sIdx) => {
            const sessionResults = allResults.filter((r) => r.session === session);
            const sem1 = sessionResults.filter((r) => r.semester === 1);
            const sem2 = sessionResults.filter((r) => r.semester === 2);
            const sem1Avg = calcAvg(sem1);
            const sem2Avg = calcAvg(sem2);
            const sessCum = cumulativeRecords.find((c) => c.session === session);
            const cumAvg = sessCum?.cumulative ?? ((sem1Avg !== null && sem2Avg !== null) ? Math.round(((sem1Avg + sem2Avg) / 2) * 100) / 100 : (sem1Avg ?? sem2Avg));
            const promo = promoRecords.find((p) => p.session === session);
            const attSem1 = calcAttendancePct(student.studentId, session, 1);
            const attSem2 = calcAttendancePct(student.studentId, session, 2);

            const subjectRows = (() => {
              const subjects = {};
              sessionResults.forEach((r) => {
                if (!subjects[r.subjectName]) subjects[r.subjectName] = {};
                subjects[r.subjectName][`sem${r.semester}`] = r;
              });
              const allSubjectNames = [...new Set(sessionResults.map((r) => r.subjectName))];
              const ordered = allSubjectNames.sort();
              return ordered.map((name) => ({ name, data: subjects[name] }));
            })();

            const className = sessionResults[0]?.className || student.className;

            return (
              <div key={session} className={sIdx > 0 ? 'border-t border-gray-200' : ''}>
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-gray-900 text-sm">{session}</span>
                    <span className="text-xs text-gray-500">|</span>
                    <School className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-600">{className}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {attSem1 !== null && <span className="text-gray-500">Att: <span className="font-medium text-gray-700">Sem1 {attSem1}%</span></span>}
                    {attSem2 !== null && <span className="text-gray-500">Sem2 {attSem2}%</span>}
                    {promo && (
                      <span className={`flex items-center gap-1 font-medium ${promo.status === 'promoted' || promo.status === 'graduated' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {promo.status === 'promoted' || promo.status === 'graduated' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {promo.status === 'promoted' ? `Promoted to ${promo.promoteTo || '--'}` : promo.status === 'graduated' ? 'Graduated' : 'Repeated'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full text-sm border-collapse mb-3">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-1/4">Subject</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Exam</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Test</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Exam</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Test</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                      </tr>
                      <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th />
                        <th colSpan={4} className="text-center px-3 py-1 text-[10px] font-semibold text-blue-600 uppercase">Semester 1</th>
                        <th colSpan={4} className="text-center px-3 py-1 text-[10px] font-semibold text-purple-600 uppercase">Semester 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectRows.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-6 text-gray-400 text-xs">No results recorded for this session</td></tr>
                      )}
                      {subjectRows.map(({ name, data }) => (
                        <tr key={name} className="border-b border-gray-100">
                          <td className="px-3 py-2.5 font-medium text-gray-900 text-xs">{name}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-700">{data.sem1?.examScore ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-700">{data.sem1?.testScore ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-900">{data.sem1?.total ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center">{data.sem1?.grade ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColor(data.sem1.grade)}`}>{data.sem1.grade}</span> : '--'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-700">{data.sem2?.examScore ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-700">{data.sem2?.testScore ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-900">{data.sem2?.total ?? '--'}</td>
                          <td className="px-3 py-2.5 text-center">{data.sem2?.grade ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColor(data.sem2.grade)}`}>{data.sem2.grade}</span> : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                      <span className="text-blue-500 font-medium">Sem 1 Avg: </span>
                      <span className={`font-bold ${statColor(sem1Avg)}`}>{sem1Avg ?? '--'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                      <span className="text-purple-500 font-medium">Sem 2 Avg: </span>
                      <span className={`font-bold ${statColor(sem2Avg)}`}>{sem2Avg ?? '--'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 font-medium">Cumulative: </span>
                      <span className={`font-bold ${cumAvg !== null && cumAvg >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{cumAvg ?? '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Overall Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-white/80 border border-white/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sessions Completed</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-white/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Overall GPA</p>
                <p className={`text-2xl font-bold ${statColor(overallCum)}`}>{overallCum ?? '--'}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-white/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Current Class</p>
                <p className="text-lg font-bold text-gray-900">{student.className}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-white/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                <p className={`text-lg font-bold flex items-center justify-center gap-1 ${isGraduated ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {isGraduated ? <GraduationCap className="w-5 h-5" /> : <School className="w-5 h-5" />}
                  {isGraduated ? 'Graduated' : 'Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-12 mb-2 border-b border-gray-300" />
                <p className="text-xs text-gray-500">Class Teacher</p>
                <p className="text-xs text-gray-400">Signature & Date</p>
              </div>
              <div className="text-center">
                <div className="h-12 mb-2 border-b border-gray-300" />
                <p className="text-xs text-gray-500">Principal</p>
                <p className="text-xs text-gray-400">Signature & Date</p>
              </div>
              <div className="text-center">
                <div className="h-12 mb-2 border-b border-gray-300" />
                <p className="text-xs text-gray-500">School Stamp</p>
                <p className="text-xs text-gray-400">Official Seal</p>
              </div>
            </div>
          </div>

          <div className="p-3 text-center text-[10px] text-gray-400 border-t border-gray-100">
            Generated by {settings?.schoolName || "MA'AD AHLIL AATHAR"} Assessment System | {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>
    </div>
  );
}
