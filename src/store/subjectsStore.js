import { create } from 'zustand';
import db from '../db/database';

const useSubjectsStore = create((set, get) => ({
  subjects: [],
  loading: true,

  loadSubjects: async () => {
    const subjects = await db.subjects.toArray();
    set({ subjects, loading: false });
  },

  addSubject: async (data) => {
    const id = await db.subjects.add({
      ...data,
      passingMark: data.passingMark ?? 50,
      createdAt: new Date().toISOString(),
    });
    const all = await db.subjects.toArray();
    set({ subjects: all });
    return id;
  },

  updateSubject: async (id, data) => {
    await db.subjects.update(id, data);
    const all = await db.subjects.toArray();
    set({ subjects: all });
  },

  deleteSubject: async (id) => {
    await db.subjects.delete(id);
    const all = await db.subjects.toArray();
    set({ subjects: all });
  },
}));

export default useSubjectsStore;
