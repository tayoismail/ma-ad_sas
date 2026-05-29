import { create } from 'zustand';
import db from '../db/database';

const useStudentsStore = create((set) => ({
  students: [],
  loading: true,

  loadStudents: async () => {
    const students = await db.students.toArray();
    set({ students, loading: false });
  },

  getStudent: async (id) => {
    return await db.students.get(id);
  },

  addStudent: async (data) => {
    const id = await db.students.add({
      ...data,
      createdAt: new Date().toISOString(),
    });
    const all = await db.students.toArray();
    set({ students: all });
    return id;
  },

  updateStudent: async (id, data) => {
    await db.students.update(id, data);
    const all = await db.students.toArray();
    set({ students: all });
  },

  deleteStudent: async (id) => {
    await db.students.delete(id);
    const all = await db.students.toArray();
    set({ students: all });
  },

  bulkAddStudents: async (records) => {
    let success = 0;
    let errors = 0;
    const existing = await db.students.toArray();
    const existingIds = new Set(existing.map((s) => s.studentId).filter(Boolean));
    for (const record of records) {
      try {
        if (record.studentId && existingIds.has(record.studentId)) {
          errors++;
          continue;
        }
        await db.students.add({
          ...record,
          createdAt: new Date().toISOString(),
        });
        if (record.studentId) existingIds.add(record.studentId);
        success++;
      } catch {
        errors++;
      }
    }
    const all = await db.students.toArray();
    set({ students: all });
    return { success, errors };
  },
}));

export default useStudentsStore;
