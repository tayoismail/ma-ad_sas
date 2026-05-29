import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, School, Users, Menu, Bell,
  Pencil, Trash2, ArrowRight,
  X, Check, Loader2
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useClassesStore from '../../store/classesStore';
import AdminSidebar from '../../components/AdminSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

const classColors = [
  { gradient: 'from-blue-500 to-cyan-500', badge: 'bg-blue-500/10 text-blue-600' },
  { gradient: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-500/10 text-emerald-600' },
  { gradient: 'from-purple-500 to-pink-500', badge: 'bg-purple-500/10 text-purple-600' },
  { gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-500/10 text-amber-600' },
  { gradient: 'from-rose-500 to-red-500', badge: 'bg-rose-500/10 text-rose-600' },
  { gradient: 'from-indigo-500 to-blue-500', badge: 'bg-indigo-500/10 text-indigo-600' },
  { gradient: 'from-teal-500 to-emerald-500', badge: 'bg-teal-500/10 text-teal-600' },
  { gradient: 'from-violet-500 to-purple-500', badge: 'bg-violet-500/10 text-violet-600' },
  { gradient: 'from-cyan-500 to-blue-500', badge: 'bg-cyan-500/10 text-cyan-600' },
  { gradient: 'from-pink-500 to-rose-500', badge: 'bg-pink-500/10 text-pink-600' },
  { gradient: 'from-orange-500 to-amber-500', badge: 'bg-orange-500/10 text-amber-600' },
];

export default function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classes, loadClasses, addClass, updateClass, deleteClass } = useClassesStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', section: 'A', promotionTo: '' });

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: '', section: 'A', promotionTo: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cls) => {
    setForm({ name: cls.name, section: cls.section || 'A', promotionTo: cls.promotionTo || '' });
    setEditingId(cls.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = {
      ...form,
      name: form.name.trim(),
      order: editingId ? undefined : classes.length + 1,
      studentCount: editingId ? undefined : 0,
    };
    if (editingId) {
      await updateClass(editingId, data);
    } else {
      await addClass(data);
    }
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClass(id);
    }
  };

  const getClassColor = (_, index) => {
    return classColors[index % classColors.length];
  };

  const getPromotionOptions = (currentName) => {
    return classes.filter((c) => c.name !== currentName).map((c) => c.name).concat('Graduated');
  };

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/classes" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
              <h1 className="text-lg font-semibold text-card-foreground">Class Management</h1>
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

        <main className="p-4 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Classes</h2>
              <p className="text-sm text-gray-500 mt-0.5">{classes.length} classes configured</p>
            </div>
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-white border-0 shadow-lg shadow-purple-500/20">
              <Plus className="w-4 h-4 mr-2" /> Add Class
            </Button>
          </div>

          {/* Add/Edit Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && resetForm()}>
              <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground">{editingId ? 'Edit Class' : 'Add New Class'}</h3>
                  <button onClick={resetForm} className="p-1 rounded-lg hover:bg-accent text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Class Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. SS1, Grade 1, etc."
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Section</label>
                    <select
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    >
                      {['A', 'B', 'C'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Promotion Path</label>
                    <select
                      value={form.promotionTo}
                      onChange={(e) => setForm({ ...form, promotionTo: e.target.value })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">-- Select --</option>
                      {getPromotionOptions(form.name).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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

          {/* Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classes.map((cls, i) => {
              const colors = getClassColor(cls.name, i);
              return (
                <Card key={cls.id} className="group bg-card border-border hover:shadow-xl hover:shadow-black/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colors.badge} mb-2`}>
                          Section {cls.section || 'A'}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                      </div>
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.gradient} bg-opacity-10`}>
                        <School className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span>{cls.studentCount || 0} students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Promotes to <strong className="text-gray-700">{cls.promotionTo || '--'}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(cls)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(cls.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-16">
              <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No Classes Yet</h3>
              <p className="text-sm text-gray-400 mb-4">Create your first class to get started</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> Create Class
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
