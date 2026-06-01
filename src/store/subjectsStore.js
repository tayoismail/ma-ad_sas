import { create } from 'zustand';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    return docRef.id;
  },

  updateSubject: async (id, data) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'subjects', id), clean);
    const all = await getDocs(collection(db, 'subjects'));
    set({ subjects: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },

  deleteSubject: async (id) => {
    await deleteDoc(doc(db, 'subjects', id));
    const all = await getDocs(collection(db, 'subjects'));
    set({ subjects: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },
}));

export default useSubjectsStore;
