import { create } from 'zustand';
import db from '../db/database';

const useResultsStore = create((set) => ({
  results: [],
  loading: true,

  loadResults: async (filters = {}) => {
    let collection = db.results.toCollection();
    if (filters.className) collection = db.results.where('className').equals(filters.className);
    if (filters.session) collection = db.results.where('session').equals(filters.session);
    if (filters.semester) collection = db.results.where('semester').equals(Number(filters.semester));
    const results = await collection.toArray();
    set({ results, loading: false });
  },

  getResultsForClass: async (className, session, semester, subjectId) => {
    const all = await db.results
      .where({ className, session, semester: Number(semester), subjectId: Number(subjectId) })
      .toArray();
    return all;
  },

  saveResult: async (data) => {
    const existing = await db.results
      .where({
        studentId: data.studentId,
        subjectId: Number(data.subjectId),
        session: data.session,
        semester: Number(data.semester),
      })
      .first();

    if (existing) {
      await db.results.update(existing.id, data);
      return existing.id;
    }
    return await db.results.add(data);
  },

  saveResults: async (records) => {
    let success = 0;
    for (const r of records) {
      try {
        const existing = await db.results
          .where({ studentId: r.studentId, subjectId: Number(r.subjectId), session: r.session, semester: Number(r.semester) })
          .first();
        if (existing) {
          await db.results.update(existing.id, r);
        } else {
          await db.results.add(r);
        }
        success++;
      } catch { /* skip individual record errors */ }
    }
    const all = await db.results.toArray();
    set({ results: all });
    return success;
  },

  deleteResult: async (id) => {
    await db.results.delete(id);
    const all = await db.results.toArray();
    set({ results: all });
  },

  loadResultsByStudent: async (studentId) => {
    set({ loading: true });
    const data = await db.results.where('studentId').equals(studentId).toArray();
    set({ results: data, loading: false });
    return data;
  },
}));

export default useResultsStore;
