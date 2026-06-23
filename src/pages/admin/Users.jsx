import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle, Key, Menu, Moon, Sun, Search
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import AdminSidebar from '../../components/AdminSidebar';
import useSubjectsStore from '../../store/subjectsStore';
import DataTable from '../../components/DataTable';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', teacherSubjects: [] });
  const [subjectSearch, setSubjectSearch] = useState('');

  const loadUsers = async () => {
    try {
      const all = await useAuthStore.getState().getUsers();
      setUsers(all);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadUsers(); loadSubjects();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', role: 'teacher', teacherSubjects: [] });
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSubjectSearch('');
  };

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, teacherSubjects: u.teacherSubjects || [] });
    setEditingId(u.id);
    setShowForm(true);
    setError('');
    setSubjectSearch('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email required'); return; }
    if (!editingId && !form.password.trim()) { setError('Password required'); return; }
    setSaving(true);
    setError('');
    try {
      const teacherClasses = form.role === 'teacher'
        ? [...new Set(subjects.filter((s) => form.teacherSubjects.includes(s.id)).map((s) => s.className))]
        : [];
      if (editingId) {
        const updates = { name: form.name, email: form.email, role: form.role, teacherSubjects: form.teacherSubjects, teacherClasses };
        await useAuthStore.getState().updateUser(editingId, updates);
      } else {
        await useAuthStore.getState().addUser({
          name: form.name, email: form.email, password: form.password,
          role: form.role, teacherSubjects: form.teacherSubjects, teacherClasses,
        });
      }
      await loadUsers();
      resetForm();
    } catch (e) {
      setError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const toggleSubject = (subjectId) => {
    setForm((prev) => {
      const current = prev.teacherSubjects || [];
      const updated = current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId];
      return { ...prev, teacherSubjects: updated };
    });
  };

  // Preview which classes the teacher will be assigned to
  const previewClasses = form.role === 'teacher'
    ? [...new Set(subjects.filter((s) => form.teacherSubjects.includes(s.id)).map((s) => s.className))]
    : [];

  // Group subjects by className for the assignment picker
  const subjectGroups = (() => {
    const lower = subjectSearch.trim().toLowerCase();
    const filtered = subjects.filter((s) => !lower || s.name.toLowerCase().includes(lower) || (s.arabicName || '').toLowerCase().includes(lower));
    const groups = {};
    filtered.forEach((s) => {
      if (!groups[s.className]) groups[s.className] = [];
      groups[s.className].push(s);
    });
    return groups;
  })();

  const isGroupFullySelected = (className) => {
    const groupSubjects = subjects.filter((s) => s.className === className);
    return groupSubjects.length > 0 && groupSubjects.every((s) => form.teacherSubjects.includes(s.id));
  };

  const toggleGroup = (className) => {
    setForm((prev) => {
      const groupSubjectIds = subjects.filter((s) => s.className === className).map((s) => s.id);
      const allSelected = isGroupFullySelected(className);
      if (allSelected) {
        return { ...prev, teacherSubjects: prev.teacherSubjects.filter((id) => !groupSubjectIds.includes(id)) };
      }
      const merged = [...new Set([...prev.teacherSubjects, ...groupSubjectIds])];
      return { ...prev, teacherSubjects: merged };
    });
  };

  const handleDelete = async (id) => {
    if (id === user?.id) { setError('Cannot delete your own account'); setDeleteConfirm(null); return; }
    setDeleting(true);
    try {
      await useAuthStore.getState().deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setError('');
    try {
      await useAuthStore.getState().resetPassword(resetPasswordUser.email);
      setResetPasswordUser(null);
    } catch (e) {
      setError(e.message || 'Failed to send reset email');
    }
    setResetting(false);
  };

  const roleColors = { admin: 'bg-purple-500/10 text-purple-600', teacher: 'bg-blue-500/10 text-blue-600', student: 'bg-emerald-500/10 text-emerald-600', parent: 'bg-orange-500/10 text-orange-600' };



  const userColumns = [
    { key: 'user', label: 'User', render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback></Avatar>
        <div><p className="font-medium text-gray-900 text-sm">{u.name}</p><p className="text-xs text-gray-400">ID: {u.id}</p></div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (u) => <span className="text-gray-600 text-sm">{u.email}</span> },
    { key: 'role', label: 'Role', render: (u) => (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize text-center ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
    )},
    { key: 'actions', label: 'Actions', sortable: false, width: '140px', render: (u) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleEdit(u); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); setResetPasswordUser(u); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Key className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(u); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div className="min-h-screen bg-slate-300">
      <AdminSidebar activePath="/admin/users" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Menu className="w-5 h-5" /></button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-white border-0 shadow-lg shadow-purple-500/20">
                <Plus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && resetForm()}>
              <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-2xl border-white/20 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit User' : 'Add User'}</h3>
                  <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" className="bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{editingId ? 'New Password (leave blank to keep)' : 'Password'}</label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'Leave blank to keep' : 'Password'} className="bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, teacherSubjects: e.target.value !== 'teacher' ? [] : form.teacherSubjects })}
                      className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-white/80 px-4 text-sm focus:outline-none focus:border-primary/40">
                      <option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option><option value="parent">Parent</option>
                    </select>
                  </div>
                  {form.role === 'teacher' && subjects.length > 0 && (
                    <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Subjects</label>
                      <div className="relative mb-2">
                        <input
                          type="text"
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          placeholder="Search subjects..."
                          className="w-full h-10 rounded-xl border-2 border-border/50 bg-white/80 px-4 pl-9 text-sm focus:outline-none focus:border-primary/40"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-3 p-2 rounded-xl border-2 border-border/50 bg-white/80">
                        {Object.entries(subjectGroups).map(([className, classSubjects]) => (
                          <div key={className}>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg mb-1 sticky top-0 bg-white/90 z-10">
                              <input
                                type="checkbox"
                                checked={isGroupFullySelected(className)}
                                onChange={() => toggleGroup(className)}
                                className="rounded border-gray-300 text-primary focus:ring-primary/30"
                              />
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">{className}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {classSubjects.filter((s) => (form.teacherSubjects || []).includes(s.id)).length}/{classSubjects.length}
                              </span>
                            </label>
                            <div className="ml-4 space-y-0.5">
                              {classSubjects.map((s) => (
                                <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
                                  <input
                                    type="checkbox"
                                    checked={(form.teacherSubjects || []).includes(s.id)}
                                    onChange={() => toggleSubject(s.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary/30"
                                  />
                                  <span className="text-sm text-gray-700">{s.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        {Object.keys(subjectGroups).length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-3">No subjects match your search</p>
                        )}
                      </div>
                      {previewClasses.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1.5">Access will be granted to classes: <strong>{previewClasses.join(', ')}</strong></p>
                      )}
                    </div>
                    </>
                  )}
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

          <Card className="overflow-hidden bg-white/60 backdrop-blur-xl border-white/20">
            <DataTable columns={userColumns} data={users} pageSize={10} />
          </Card>
        </main>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <Card className="w-full max-w-sm p-6 bg-white/90 backdrop-blur-2xl border-white/20 shadow-2xl animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 mx-auto mb-4 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-1">{deleteConfirm.name} ({deleteConfirm.email})</p>
            <p className="text-xs text-gray-400 mb-6">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && (setResetPasswordUser(null), setError(''))}>
          <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-2xl border-white/20 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button onClick={() => { setResetPasswordUser(null); setError(''); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Send password reset email to <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
            </p>
            <p className="text-sm text-gray-400 mb-6">
              An email will be sent to their inbox with instructions to reset their password.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResetPasswordUser(null); setError(''); }}>Cancel</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleResetPassword} disabled={resetting}>
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Send Reset Email
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
