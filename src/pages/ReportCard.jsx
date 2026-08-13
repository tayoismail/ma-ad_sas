import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, Printer, Download, ArrowLeft, GraduationCap, CheckCircle2, Loader2, AlertCircle, Moon, Sun, FileText, Award } from 'lucide-react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useThemeStore } from '../store/themeStore';
import { calculateGrade, gradeStyle } from '../lib/grading';
import { semesterLabel, formatStudentName } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY;
const PAYMENT_AMOUNT = 500; // ₦500

export default function ReportCard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'unpaid' | 'paid'
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [settings, setSettings] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'school_settings'));
      if (snap.exists()) {
        setSettings(snap.data());
      }
    } catch (err) {
      console.error('Settings load error:', err);
    }
  };

  const handleSearch = async () => {
    if (!studentId.trim()) {
      setError('Please enter your Student ID');
      return;
    }
    setLoading(true);
    setError('');
    setStudent(null);
    setResults([]);
    setPaymentStatus(null);
    setShowReport(false);

    try {
      // Find student by studentId
      const studentsSnap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId.trim())));
      
      if (studentsSnap.empty) {
        setError('Student not found. Please check your Student ID.');
        setLoading(false);
        return;
      }

      const studentDoc = studentsSnap.docs[0];
      const studentData = { id: studentDoc.id, ...studentDoc.data() };
      setStudent(studentData);

      // Check payment status for current semester
      if (settings) {
        const safeSession = settings.currentSession.replace(/\//g, '-');
        const paymentId = `${studentData.studentId}_${safeSession}_sem${settings.currentSemester}`;
        const paymentSnap = await getDoc(doc(db, 'payments', paymentId));
        
        if (paymentSnap.exists() && paymentSnap.data().status === 'completed') {
          setPaymentStatus('paid');
          await loadResults(studentData, settings);
        } else {
          setPaymentStatus('unpaid');
        }
      } else {
        setPaymentStatus('unpaid');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to look up student: ${err.message}`);
    }
    setLoading(false);
  };

  const loadResults = async (studentData, settingsData) => {
    try {
      const resultsSnap = await getDocs(
        query(
          collection(db, 'results'),
          where('studentId', '==', studentData.studentId),
          where('session', '==', settingsData.currentSession),
          where('semester', '==', settingsData.currentSemester)
        )
      );
      const resultsData = resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setResults(resultsData);
      setShowReport(true);
    } catch (err) {
      console.error('Load results error:', err);
      setError('Failed to load results. Please try again.');
    }
  };

  const flutterwaveConfig = useMemo(() => {
    if (!student) return null;
    return {
      public_key: FLW_PUBLIC_KEY,
      tx_ref: `${student.studentId}_${Date.now()}`,
      amount: PAYMENT_AMOUNT,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd',
      customer: {
        email: `${student.studentId}@mahd.edu.ng`,
        name: student.name,
      },
      customizations: {
        title: "MA'AD AHLIL AATHAR",
        description: `Report Card Fee - ${student.name} (${student.className})`,
        logo: '',
      },
    };
  }, [student]);

  const handleFlutterwaveCallback = async (response) => {
    closePaymentModal();
    if (response.status === 'successful') {
      try {
        const safeSession = settings.currentSession.replace(/\//g, '-');
        const paymentId = `${student.studentId}_${safeSession}_sem${settings.currentSemester}`;
        await setDoc(doc(db, 'payments', paymentId), {
          studentId: student.studentId,
          studentName: student.name,
          className: student.className,
          session: settings.currentSession,
          semester: settings.currentSemester,
          amount: PAYMENT_AMOUNT,
          currency: 'NGN',
          transactionId: response.transaction_id,
          reference: response.tx_ref,
          status: 'completed',
          paidAt: new Date().toISOString(),
        });
        setPaymentStatus('paid');
        await loadResults(student, settings);
      } catch (err) {
        console.error('Payment save error:', err);
        setError('Payment verified but failed to save. Please contact support.');
      }
    } else {
      setError('Payment was not successful. Please try again.');
    }
    setPaymentLoading(false);
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${student?.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1f2937;
              background: #fff;
              line-height: 1.5;
            }
            
            .report-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 30px;
            }
            
            /* Header */
            .report-header {
              text-align: center;
              padding-bottom: 20px;
              margin-bottom: 24px;
              border-bottom: 3px solid #1f2937;
            }
            
            .school-name {
              font-size: 28px;
              font-weight: 800;
              color: #1f2937;
              margin-bottom: 4px;
              letter-spacing: -0.5px;
            }
            
            .school-address {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 16px;
            }
            
            .report-title {
              font-size: 18px;
              font-weight: 700;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 2px;
              background: #f3f4f6;
              padding: 8px 24px;
              border-radius: 6px;
              display: inline-block;
            }
            
            /* Student Info */
            .student-info {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              padding: 16px;
              background: #f9fafb;
              border-radius: 10px;
              margin-bottom: 24px;
              border: 1px solid #e5e7eb;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            
            .info-label {
              font-size: 10px;
              font-weight: 600;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
            }
            
            /* Table */
            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            
            .results-table thead th {
              background: #1f2937;
              color: #fff;
              padding: 12px 16px;
              text-align: left;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .results-table thead th:first-child {
              border-radius: 8px 0 0 0;
            }
            
            .results-table thead th:last-child {
              border-radius: 0 8px 0 0;
            }
            
            .results-table tbody td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            
            .results-table tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .results-table tbody tr:hover {
              background: #f3f4f6;
            }
            
            .results-table tfoot td {
              padding: 14px 16px;
              border-top: 3px solid #1f2937;
              font-weight: 700;
              background: #f3f4f6;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            .grade-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
            }
            
            .grade-A { background: #dcfce7; color: #166534; }
            .grade-B { background: #dbeafe; color: #1e40af; }
            .grade-C { background: #fef9c3; color: #854d0e; }
            .grade-D { background: #ffedd5; color: #9a3412; }
            .grade-F { background: #fee2e2; color: #991b1b; }
            
            /* Summary */
            .summary-section {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              padding: 20px;
              background: #eff6ff;
              border-radius: 10px;
              margin-bottom: 24px;
              border: 1px solid #bfdbfe;
            }
            
            .summary-item {
              text-align: center;
            }
            
            .summary-label {
              font-size: 10px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: 800;
              color: #1e40af;
            }
            
            /* Signatures */
            .signatures {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 40px;
              margin-top: 40px;
              padding-top: 24px;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              height: 50px;
              border-bottom: 1px solid #9ca3af;
              margin-bottom: 8px;
            }
            
            .signature-label {
              font-size: 11px;
              font-weight: 600;
              color: #374151;
            }
            
            .signature-sublabel {
              font-size: 9px;
              color: #9ca3af;
            }
            
            /* Footer */
            .report-footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #9ca3af;
            }
            
            @media print {
              body { margin: 0; padding: 0; }
              .report-container { padding: 20px; max-width: 100%; }
              .results-table thead th { background: #1f2937 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .results-table tbody tr:nth-child(even) { background: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .summary-section { background: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .grade-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  // Calculate totals
  const totalScore = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
  const overallGrade = calculateGrade(averageScore, settings?.gradingScale);

  return (
    <div className="min-h-screen bg-slate-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">MA'AD AHLIL AATHAR</p>
                <p className="text-xs text-muted-foreground">Report Card Portal</p>
              </div>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Search Section */}
        {!showReport && (
          <Card className="p-6 sm:p-8 border-border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-2">View Your Report Card</h2>
              <p className="text-muted-foreground">Enter your Student ID to view and print your report card</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Enter your Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/60"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="gradient-accent text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>
          </Card>
        )}

        {/* Student Found - Payment Required */}
        {student && paymentStatus === 'unpaid' && (
          <Card className="p-6 sm:p-8 border-border">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {formatStudentName(student.name)?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-card-foreground mb-1">{formatStudentName(student.name)}</h3>
                <p className="text-muted-foreground mb-1">
                  <span className="font-medium">ID:</span> {student.studentId} | <span className="font-medium">Class:</span> {student.className}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-sm font-medium mt-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Required: ₦{PAYMENT_AMOUNT.toLocaleString()}
                </div>
              </div>
              <div className="flex-shrink-0">
                {flutterwaveConfig ? (
                  <FlutterWaveButton
                    {...flutterwaveConfig}
                    callback={handleFlutterwaveCallback}
                    onClose={() => setPaymentLoading(false)}
                    className="gradient-accent text-white h-12 px-8 text-lg font-bold rounded-xl border-0 cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5 mr-2 inline" />
                    Pay ₦{PAYMENT_AMOUNT.toLocaleString()}
                  </FlutterWaveButton>
                ) : (
                  <Button disabled className="h-12 px-8 text-lg font-bold">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading...
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-left mt-4">
              You need to pay ₦{PAYMENT_AMOUNT.toLocaleString()} to view your report card for {settings?.currentSession || '2024/2025'} ({semesterLabel(settings?.currentSemester || 1)}).
            </p>
          </Card>
        )}

        {/* Report Card */}
        {showReport && student && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <Button variant="outline" onClick={() => { setShowReport(false); setStudent(null); setResults([]); setPaymentStatus(null); setStudentId(''); }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Search Another
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={handleDownload} className="gradient-accent text-white">
                  <Download className="w-4 h-4 mr-2" /> Save as PDF
                </Button>
              </div>
            </div>

            {/* Printable Report Card */}
            <div ref={reportRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-0">
              {/* Header */}
              <div className="text-center py-8 px-6 border-b-4 border-gray-800">
                <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">MA'AD AHLIL AATHAR</h1>
                <p className="text-sm text-gray-500 italic mb-2">Assessment System</p>
                <p className="text-xs text-gray-400">No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State</p>
                <div className="w-20 h-1 bg-gray-800 mx-auto my-4" />
                <div className="inline-block bg-gray-100 px-6 py-2 rounded-lg">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-widest">Student Report Card</p>
                </div>
              </div>

              {/* Student Info */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="info-item">
                    <span className="info-label">Student Name</span>
                    <span className="info-value">{formatStudentName(student.name)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Student ID</span>
                    <span className="info-value">{student.studentId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Class</span>
                    <span className="info-value">{student.className}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Session</span>
                    <span className="info-value">{settings?.currentSession}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Term</span>
                    <span className="info-value">{semesterLabel(settings?.currentSemester)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">No. of Subjects</span>
                    <span className="info-value">{results.length}</span>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="p-6">
                {results.length > 0 ? (
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th className="text-center" style={{ width: '40px' }}>#</th>
                        <th>Subject</th>
                        <th className="text-center">Exam</th>
                        <th className="text-center">CA</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => {
                        const g = calculateGrade(r.total, settings?.gradingScale);
                        return (
                          <tr key={r.id}>
                            <td className="text-center text-gray-400">{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{r.subjectName}</td>
                            <td className="text-center">{r.examScore ?? '-'}</td>
                            <td className="text-center">{r.testScore ?? '-'}</td>
                            <td className="text-center" style={{ fontWeight: 700 }}>{r.total}</td>
                            <td className="text-center">
                              <span className={`grade-badge grade-${g.grade}`}>{g.grade}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-right" style={{ fontWeight: 800 }}>Average:</td>
                        <td className="text-center" style={{ fontSize: '18px', fontWeight: 800 }}>{averageScore}</td>
                        <td className="text-center">
                          <span className={`grade-badge grade-${overallGrade.grade}`} style={{ fontSize: '14px' }}>{overallGrade.grade}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No results available for this term.</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {results.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="summary-section">
                    <div className="summary-item">
                      <p className="summary-label">Total Subjects</p>
                      <p className="summary-value">{results.length}</p>
                    </div>
                    <div className="summary-item">
                      <p className="summary-label">Total Score</p>
                      <p className="summary-value">{totalScore}</p>
                    </div>
                    <div className="summary-item">
                      <p className="summary-label">Average</p>
                      <p className="summary-value">{averageScore}</p>
                    </div>
                    <div className="summary-item">
                      <p className="summary-label">Grade</p>
                      <p className="summary-value">{overallGrade.grade}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="px-6 pb-6">
                <div className="signatures">
                  <div className="signature-box">
                    <div className="signature-line" />
                    <p className="signature-label">Class Teacher</p>
                    <p className="signature-sublabel">Signature & Date</p>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line" />
                    <p className="signature-label">Principal</p>
                    <p className="signature-sublabel">Signature & Date</p>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line" />
                    <p className="signature-label">School Stamp</p>
                    <p className="signature-sublabel">Official Seal</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="report-footer">
                <p>Generated on {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="mt-1">&copy; {new Date().getFullYear()} MA'AD AHLIL AATHAR. All rights reserved.</p>
              </div>
            </div>
          </>
        )}

        {/* Back to Home */}
        {!student && !loading && (
          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
