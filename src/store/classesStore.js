import { create } from 'zustand';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const useClassesStore = create((set) => ({
  classes: [],
  loading: true,

  loadClasses: async () => {
    const snapshot = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    const classes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ classes, loading: false });
  },

  addClass: async (cls) => {
    const docRef = await addDoc(collection(db, 'classes'), cls);
    const all = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    set({ classes: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    return docRef.id;
  },

  updateClass: async (id, data) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'classes', id), clean);
    const all = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    set({ classes: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },

  deleteClass: async (id) => {
    await deleteDoc(doc(db, 'classes', id));
    const all = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    set({ classes: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },
}));

export default useClassesStore;
