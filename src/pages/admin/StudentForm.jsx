import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, User, Menu, Loader2, CheckCircle2, AlertCircle, Moon, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import AdminSidebar from '../../components/AdminSidebar';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses } = useClassesStore();
  const { addStudent, updateStudent, getStudent } = useStudentsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    studentId: '',
    name: '',
    arabicName: '',
    dateOfBirth: '',
    sex: '',
    className: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !form.className && !isEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({ ...f, className: classes[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  useEffect(() => {
    if (isEdit) {
      getStudent(id).then((student) => {
        if (student) {
          setForm({
            studentId: student.studentId || '',
            name: student.name || '',
            arabicName: student.arabicName || '',
            dateOfBirth: student.dateOfBirth || '',
            sex: student.sex || '',
            className: student.className || '',
            parentName: student.parentName || '',
            parentPhone: student.parentPhone || '',
            parentEmail: student.parentEmail || '',
            enrollmentDate: student.enrollmentDate || '',
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Student name is required'); return; }
    if (!form.className) { setFormError('Please select a class'); return; }
    if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
      setFormError('Please enter a valid parent email address'); return;
    }
    if (form.parentPhone && !/^[\d\s\-+()]{6,20}$/.test(form.parentPhone)) {
      setFormError('Please enter a valid phone number'); return;
    }

    try {
      const snap = await getDocs(query(collection(db, 'students'), where('studentId', '==', form.studentId)));
      const existing = snap.docs[0];
      if (existing && (!isEdit || existing.id !== id)) {
        setFormError('Student ID already exists');
        return;
      }
    } catch {
      setFormError('Failed to validate student ID');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateStudent(id, form);
      } else {
        await addStudent(form);
      }
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        navigate('/admin/students');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to save student');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/students" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/admin/students')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-card-foreground">{isEdit ? 'Edit Student' : 'Register Student'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-muted-foreground transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-3xl">
          {formError && (
            <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4" /> {formError}
            </div>
          )}
          {saved && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Student {isEdit ? 'updated' : 'registered'} successfully!
            </div>
          )}

          <Card className="p-6 lg:p-8 bg-card border-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <User className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
                <p className="text-sm text-gray-500">Enter the student details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Student Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name in English"
                    className="bg-white/80"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Arabic Name (Optional)</label>
                  <Input
                    value={form.arabicName}
                    onChange={(e) => setForm({ ...form, arabicName: e.target.value })}
                    placeholder="الاسم بالعربية"
                    dir="rtl"
                    className="bg-white/80 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
                  <Input
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    placeholder="Auto or manual"
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sex</label>
                  <select
                    value={form.sex}
                    onChange={(e) => setForm({ ...form, sex: e.target.value })}
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Class <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  >
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Enrollment Date</label>
                  <Input
                    type="date"
                    value={form.enrollmentDate}
                    onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Parent / Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Name</label>
                    <Input
                      value={form.parentName}
                      onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                      placeholder="Parent full name"
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Phone</label>
                    <Input
                      type="tel"
                      value={form.parentPhone}
                      onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                      placeholder="Phone number"
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Email</label>
                    <Input
                      type="email"
                      value={form.parentEmail}
                      onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                      placeholder="parent@example.com"
                      className="bg-white/80"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/students')}>Cancel</Button>
                <Button type="submit" className="gradient-accent text-white border-0 min-w-[160px]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {isEdit ? 'Update Student' : 'Register Student'}
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
