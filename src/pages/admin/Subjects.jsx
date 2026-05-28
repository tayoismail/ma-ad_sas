import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, BookOpen, GraduationCap, School,
  LogOut, Bell, Menu, Pencil, Trash2, X, Check,
  Loader2, BookMarked, Users, Globe, AlertCircle,
  Award, CalendarDays, TrendingUp, Database, Settings, LayoutDashboard, Printer
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useClassesStore from '../../store/classesStore';
import AdminSidebar from '../../components/AdminSidebar';
import useSubjectsStore from '../../store/subjectsStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { classes, loadClasses } = useClassesStore();
  const { subjects, loadSubjects, addSubject, updateSubject, deleteSubject } = useSubjectsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '', arabicName: '', className: classes[0]?.name || 'Class 1', passingMark: 50,
  });

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  const resetForm = () => {
    setForm({ name: '', arabicName: '', className: classes[0]?.name || 'Class 1', passingMark: 50 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (subj) => {
    setForm({ name: subj.name, arabicName: subj.arabicName || '', className: subj.className, passingMark: subj.passingMark ?? 50 });
    setEditingId(subj.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingId) {
      await updateSubject(editingId, form);
    } else {
      await addSubject(form);
    }
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    await deleteSubject(id);
    setDeleteConfirm(null);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const grouped = {};
  subjects.forEach((s) => {
    if (!grouped[s.className]) grouped[s.className] = [];
    grouped[s.className].push(s);
  });

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/subjects" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-card-foreground">Subjects</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <p className="text-sm font-medium text-card-foreground hidden sm:block">{user?.name || 'Admin'}</p>
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">{(user?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Subjects</h2>
              <p className="text-sm text-gray-500 mt-0.5">{subjects.length} subjects across {Object.keys(grouped).length} classes</p>
            </div>
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-white border-0 shadow-lg shadow-purple-500/20">
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && resetForm()}>
              <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
                  <button onClick={resetForm} className="p-1 rounded-lg hover:bg-accent text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Subject Name (English) <span className="text-red-400">*</span></label>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" className="bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Subject Name (Arabic)</label>
                    <Input value={form.arabicName} onChange={(e) => setForm({ ...form, arabicName: e.target.value })} placeholder="例如 الرياضيات" dir="rtl" className="bg-white/80 text-right" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Assigned Class <span className="text-red-400">*</span></label>
                    <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                      {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Passing Mark</label>
                    <Input type="number" min={0} max={100} value={form.passingMark} onChange={(e) => setForm({ ...form, passingMark: Number(e.target.value) })} className="bg-white/80 w-24" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                    <Button className="flex-1 gradient-accent text-white border-0" onClick={handleSubmit} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16">
              <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No Subjects Yet</h3>
              <p className="text-sm text-gray-400 mb-4">Create subjects and assign them to classes</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> Create Subject
              </Button>
            </div>
          )}

          {Object.entries(grouped).map(([className, classSubjects]) => (
            <div key={className}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                {className}
                <span className="text-xs font-normal text-gray-400">({classSubjects.length} subjects)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {classSubjects.map((subj) => (
                  <Card key={subj.id} className="group p-4 bg-card border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <BookMarked className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{subj.name}</p>
                          {subj.arabicName && <p className="text-xs text-gray-400" dir="rtl">{subj.arabicName}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Pass: {subj.passingMark ?? 50}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(subj)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(subj.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <Card className="w-full max-w-sm p-6 bg-card border-border shadow-2xl animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 mx-auto mb-4 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Delete Subject?</h3>
            <p className="text-sm text-muted-foreground mb-6">This will also remove all results for this subject.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
