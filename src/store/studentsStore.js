import { create } from 'zustand';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auditLog } from '../lib/audit';

const useStudentsStore = create((set) => ({
  students: [],
  loading: true,

  loadStudents: async () => {
    const snapshot = await getDocs(collection(db, 'students'));
    const students = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ students, loading: false });
  },

  getStudent: async (id) => {
    const snap = await getDoc(doc(db, 'students', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  addStudent: async (data) => {
    const docRef = await addDoc(collection(db, 'students'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    const all = await getDocs(collection(db, 'students'));
    set({ students: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    auditLog('student.create', 'students', { name: data.name, className: data.className, studentId: data.studentId });
    return docRef.id;
  },

  updateStudent: async (id, data) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'students', id), clean);
    const all = await getDocs(collection(db, 'students'));
    set({ students: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    auditLog('student.update', 'students', { id, fields: Object.keys(clean) });
  },

  deleteStudent: async (id) => {
    const studentSnap = await getDoc(doc(db, 'students', id));
    let studentName = '';
    let studentClass = '';
    let cascadeCount = 0;
    if (studentSnap.exists()) {
      const student = studentSnap.data();
      studentName = student.name;
      studentClass = student.className;
      const resultsSnap = await getDocs(query(collection(db, 'results'), where('studentId', '==', student.studentId)));
      for (const r of resultsSnap.docs) await deleteDoc(r.ref);
      cascadeCount += resultsSnap.size;

      const attendanceSnap = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', student.studentId)));
      for (const r of attendanceSnap.docs) await deleteDoc(r.ref);
      cascadeCount += attendanceSnap.size;

      const promoSnap = await getDocs(query(collection(db, 'promotions'), where('studentId', '==', student.studentId)));
      for (const r of promoSnap.docs) await deleteDoc(r.ref);
      cascadeCount += promoSnap.size;
    }
    await deleteDoc(doc(db, 'students', id));
    auditLog('student.delete', 'students', { id, name: studentName, className: studentClass, cascadeDeletes: cascadeCount });
    const all = await getDocs(collection(db, 'students'));
    set({ students: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },

  bulkAddStudents: async (records) => {
    let success = 0;
    let errors = 0;
    const existingSnap = await getDocs(collection(db, 'students'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.data().studentId).filter(Boolean));
    for (const record of records) {
      try {
        if (record.studentId && existingIds.has(record.studentId)) {
          errors++;
          continue;
        }
        await addDoc(collection(db, 'students'), {
          ...record,
          createdAt: new Date().toISOString(),
        });
        if (record.studentId) existingIds.add(record.studentId);
        success++;
      } catch {
        errors++;
      }
    }
    const all = await getDocs(collection(db, 'students'));
    set({ students: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    if (success > 0) auditLog('student.bulk_create', 'students', { requested: records.length, success, errors });
    return { success, errors };
  },
}));

export default useStudentsStore;
