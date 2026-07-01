import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Upload, Download, Menu,
  Trash2, Pencil, Eye, X, ArrowLeft,
  FileSpreadsheet, AlertCircle, CheckCircle2, Loader2,
  FileText, Moon, Sun
} from 'lucide-react';
import * as XLSX from 'xlsx';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import useClassesStore from '../../store/classesStore';
import useStudentsStore from '../../store/studentsStore';
import useSubjectsStore from '../../store/subjectsStore';
import AdminSidebar from '../../components/AdminSidebar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function StudentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { classes, loadClasses, loading: classesLoading } = useClassesStore();
  const { students, loadStudents, deleteStudent, bulkAddStudents, loading: studentsLoading } = useStudentsStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [duplicateIds, setDuplicateIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadClasses();
    loadStudents();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherClassNames = useMemo(() => {
    if (user?.role !== 'teacher') return null;
    const teacherSubjectIds = user?.teacherSubjects;
    if (!teacherSubjectIds || teacherSubjectIds.length === 0) return [];
    return [...new Set(
      subjects
        .filter((s) => teacherSubjectIds.includes(s.id))
        .map((s) => s.className)
    )];
  }, [user, subjects]);

  const filteredClasses = useMemo(() => {
    if (!teacherClassNames) return classes;
    return classes.filter((c) => teacherClassNames.includes(c.name));
  }, [classes, teacherClassNames]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        s.parentName?.toLowerCase().includes(search.toLowerCase());
      const matchClass = !classFilter || s.className === classFilter;
      const matchSex = !sexFilter || s.sex === sexFilter;
      return matchSearch && matchClass && matchSex;
    });
  }, [students, search, classFilter, sexFilter]);

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
        name: r.name || r.Name || r.student_name || r.Student_Name || '',
        arabicName: r.arabic_name || r.Arabic_Name || '',
        studentId: r.student_id || r.Student_ID || r.id || r.ID || '',
        dateOfBirth: r.date_of_birth || r.Date_of_Birth || r.dob || r.DOB || '',
        sex: r.sex || r.Sex || '',
        className: r.class || r.Class || r.class_name || r.Class_Name || '',
        parentName: r.parent_name || r.Parent_Name || '',
        parentPhone: r.parent_phone || r.Parent_Phone || '',
        parentEmail: r.parent_email || r.Parent_Email || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
      }));
      setUploadData(mapped.filter((r) => r.name));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleBulkUpload = async () => {
    setUploading(true);
    const result = await bulkAddStudents(uploadData);
    setUploadResult(result);
    setDuplicateIds(result.duplicateIds || []);
    setUploading(false);
    setUploadData([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { setUploadResult(null); setDuplicateIds([]); }, 8000);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      { name: 'Example', arabic_name: 'مثال', student_id: 'STU001', date_of_birth: '2010-01-15', sex: 'Male', class: 'SS1A', parent_name: 'Parent Name', parent_phone: '08012345678', parent_email: 'parent@email.com' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students_upload_template.xlsx');
  };

  const handleDelete = async (id) => {
    await deleteStudent(id);
    setDeleteConfirm(null);
  };

  const columns = [
    {
      key: 'studentId',
      label: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500">{row.studentId || '--'}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'className',
      label: 'Class',
      hideOnMobile: true,
      render: (row) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {row.className}
        </span>
      ),
    },
    {
      key: 'sex',
      label: 'Sex',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm text-gray-600">{row.sex || '--'}</span>
      ),
    },
    {
      key: 'parentName',
      label: 'Parent',
      hideOnMobile: true,
      render: (row) => (
        <div className="text-sm">
          <p className="text-gray-700">{row.parentName || '--'}</p>
          {row.parentPhone && <p className="text-xs text-gray-400">{row.parentPhone}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/admin/students/${row.id}`)}
            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {user?.role !== 'teacher' && (
            <button
              onClick={() => navigate(`/admin/students/${row.id}/edit`)}
              className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/transcript/${row.id}`)}
            className="p-2 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors"
            title="View Full Academic Record"
          >
            <FileText className="w-4 h-4" />
          </button>
          {user?.role !== 'teacher' && (
            <button
              onClick={() => setDeleteConfirm(row.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-300">
      <div className="" />

      <AdminSidebar activePath="/admin/students" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-card-foreground">Students</h1>
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

        <main className="p-4 lg:p-8 space-y-6">
          {/* Upload result toast */}
          {uploadResult && (
            <div className={`space-y-2 p-4 rounded-xl border text-sm animate-fade-in ${
              uploadResult.errors === 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                {uploadResult.errors === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {uploadResult.success} students imported{uploadResult.errors > 0 ? `, ${uploadResult.errors} failed` : ''}
              </div>
              {duplicateIds.length > 0 && (
                <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-600 font-medium">Duplicate Student IDs skipped:</p>
                    <p className="text-red-500/80 mt-1 font-mono text-xs">{duplicateIds.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {(classesLoading || studentsLoading) && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading students...</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">All Students</h2>
              <p className="text-sm text-gray-500 mt-0.5">{students.length} total students</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {user?.role !== 'teacher' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
                    <Upload className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Mass Upload</span><span className="sm:hidden">Upload</span>
                  </Button>
                  <Button size="sm" onClick={() => navigate('/admin/students/new')} className="gradient-accent text-white border-0 shadow-lg shadow-purple-500/20">
                    <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Add Student</span><span className="sm:hidden">Add</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mass Upload */}
          {showUpload && (
            <Card className="p-6 bg-card border-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900">Mass Upload Students</h3>
                </div>
                <button onClick={() => { setShowUpload(false); setUploadData([]); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV or Excel file with columns: name, arabic_name, student_id, date_of_birth, sex, class, parent_name, parent_phone, parent_email
              </p>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-1" /> Download Template
                </Button>
              </div>
              <label className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 bg-white/30 hover:bg-white/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Choose file or drag here</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </label>

              {uploadData.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-600">{uploadData.length} records parsed</p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-white/20 bg-white/30">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Name</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Sex</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Class</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">ID</th>
                        </tr>
                      </thead>
                      <tbody>
                          {uploadData.slice(0, 20).map((r, i) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-gray-700">{r.name}</td>
                            <td className="px-3 py-2 text-gray-500">{r.sex || '--'}</td>
                            <td className="px-3 py-2 text-gray-500">{r.className}</td>
                            <td className="px-3 py-2 text-gray-400 font-mono text-xs">{r.studentId}</td>
                          </tr>
                        ))}
                        {uploadData.length > 20 && (
                          <tr className="border-t border-white/10">
                            <td colSpan={4} className="px-3 py-2 text-center text-gray-400 text-xs">
                              ...and {uploadData.length - 20} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setUploadData([])}>Cancel</Button>
                    <Button onClick={handleBulkUpload} disabled={uploading} className="gradient-accent text-white border-0">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Import {uploadData.length} Students
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or parent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/60"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[160px]"
            >
              <option value="">All Classes</option>
              {filteredClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="h-11 rounded-xl border-2 border-border/50 bg-white/60 px-4 text-sm shadow-sm focus:outline-none focus:border-primary/40 min-w-[120px]"
            >
              <option value="">All Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Students Table */}
          <DataTable
            columns={columns}
            data={filtered}
            pageSize={10}
          />
        </main>
      </div>

      <ConfirmModal
        open={deleteConfirm !== null}
        title="Delete Student?"
        message="This action cannot be undone. The student record will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
