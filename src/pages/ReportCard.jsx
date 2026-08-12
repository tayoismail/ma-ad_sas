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
      const snap = await getDoc(doc(db, 'settings', 'config'));
      if (snap.exists()) setSettings(snap.data());
    } catch { /* ignore */ }
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
        const paymentId = `${studentData.studentId}_${settings.currentSession}_sem${settings.currentSemester}`;
        const paymentSnap = await getDoc(doc(db, 'payments', paymentId));
        
        if (paymentSnap.exists() && paymentSnap.data().status === 'completed') {
          setPaymentStatus('paid');
          await loadResults(studentData, settings);
        } else {
          setPaymentStatus('unpaid');
        }
      } else {
        // Settings not loaded yet, show unpaid state
        setPaymentStatus('unpaid');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to look up student. Please try again.');
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
    const session = settings?.currentSession || '2024/2025';
    const semester = settings?.currentSemester || 1;
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
        const paymentId = `${student.studentId}_${settings.currentSession}_sem${settings.currentSemester}`;
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
      <html>
        <head>
          <title>Report Card - ${student?.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; margin: 0; }
            .school-motto { font-style: italic; color: #666; margin: 5px 0; }
            .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .info-item { display: flex; gap: 10px; }
            .info-label { font-weight: bold; min-width: 100px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f0f0f0; font-weight: bold; }
            .grade-a { color: #16a34a; font-weight: bold; }
            .grade-b { color: #2563eb; font-weight: bold; }
            .grade-c { color: #ca8a04; font-weight: bold; }
            .grade-d { color: #ea580c; font-weight: bold; }
            .grade-f { color: #dc2626; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
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
    handlePrint(); // Same as print for now - user can save as PDF from print dialog
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
            <Card ref={reportRef} className="p-6 sm:p-8 border-border">
              {/* Header */}
              <div className="text-center border-b-2 border-border pb-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-card-foreground mb-1">MA'AD AHLIL AATHAR</h1>
                <p className="text-muted-foreground italic mb-1">Assessment System</p>
                <p className="text-sm text-muted-foreground">No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State</p>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl mb-6">
                <div><span className="font-semibold text-card-foreground">Name:</span> <span className="text-muted-foreground">{formatStudentName(student.name)}</span></div>
                <div><span className="font-semibold text-card-foreground">Student ID:</span> <span className="text-muted-foreground">{student.studentId}</span></div>
                <div><span className="font-semibold text-card-foreground">Class:</span> <span className="text-muted-foreground">{student.className}</span></div>
                <div><span className="font-semibold text-card-foreground">Session:</span> <span className="text-muted-foreground">{settings?.currentSession}</span></div>
                <div><span className="font-semibold text-card-foreground">Term:</span> <span className="text-muted-foreground">{semesterLabel(settings?.currentSemester)}</span></div>
                <div><span className="font-semibold text-card-foreground">No. of Subjects:</span> <span className="text-muted-foreground">{results.length}</span></div>
              </div>

              {/* Results Table */}
              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold text-card-foreground">Subject</th>
                        <th className="text-center px-4 py-3 font-semibold text-card-foreground">Exam</th>
                        <th className="text-center px-4 py-3 font-semibold text-card-foreground">CA</th>
                        <th className="text-center px-4 py-3 font-semibold text-card-foreground">Total</th>
                        <th className="text-center px-4 py-3 font-semibold text-card-foreground">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => {
                        const g = calculateGrade(r.total, settings?.gradingScale);
                        const gs = gradeStyle(g.grade);
                        return (
                          <tr key={r.id} className="border-t border-border">
                            <td className="px-4 py-3 font-medium text-card-foreground">{r.subjectName}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{r.examScore ?? '-'}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{r.testScore ?? '-'}</td>
                            <td className="px-4 py-3 text-center font-semibold text-card-foreground">{r.total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${gs.text} ${gs.bg}`}>{g.grade}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/30">
                        <td colSpan={3} className="px-4 py-3 font-bold text-card-foreground text-right">Average:</td>
                        <td className="px-4 py-3 text-center font-bold text-card-foreground text-lg">{averageScore}</td>
                        <td className="px-4 py-3 text-center">
                          {(() => { const gs = gradeStyle(overallGrade.grade); return <span className={`px-2 py-0.5 rounded text-xs font-bold ${gs.text} ${gs.bg}`}>{overallGrade.grade}</span>; })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No results available for this term.</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
                <p>Generated on {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="mt-1">&copy; {new Date().getFullYear()} MA'AD AHLIL AATHAR. All rights reserved.</p>
              </div>
            </Card>
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
