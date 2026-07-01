import { create } from 'zustand';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auditLog } from '../lib/audit';

const useSubjectsStore = create((set) => ({
  subjects: [],
  loading: true,

  loadSubjects: async () => {
    const snapshot = await getDocs(collection(db, 'subjects'));
    const subjects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ subjects, loading: false });
  },

  addSubject: async (data) => {
    const docRef = await addDoc(collection(db, 'subjects'), {
      ...data,
      passingMark: data.passingMark ?? 50,
      createdAt: new Date().toISOString(),
    });
    const all = await getDocs(collection(db, 'subjects'));
    set({ subjects: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    auditLog('subject.create', 'subjects', { name: data.name, className: data.className });
    return docRef.id;
  },

  updateSubject: async (id, data) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'subjects', id), clean);
    const all = await getDocs(collection(db, 'subjects'));
    set({ subjects: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    auditLog('subject.update', 'subjects', { id, fields: Object.keys(clean) });
  },

  deleteSubject: async (id) => {
    // Delete all results for this subject first
    const resultsSnap = await getDocs(query(collection(db, 'results'), where('subjectId', '==', id)));
    let cascadeCount = 0;
    for (const d of resultsSnap.docs) {
      await deleteDoc(d.ref);
      cascadeCount++;
    }
    await deleteDoc(doc(db, 'subjects', id));
    auditLog('subject.delete', 'subjects', { id, cascadeDeletes: cascadeCount });
    const all = await getDocs(collection(db, 'subjects'));
    set({ subjects: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },
}));

export default useSubjectsStore;
