import { create } from 'zustand';
import db from '../db/database';

const useAttendanceStore = create((set) => ({
  records: [],
  loading: false,

  loadRecords: async (filters = {}) => {
    set({ loading: true });
    let collection = db.attendance.toCollection();
    if (filters.className) collection = db.attendance.where('className').equals(filters.className);
    if (filters.session) collection = db.attendance.where('session').equals(filters.session);
    if (filters.semester) collection = db.attendance.where('semester').equals(Number(filters.semester));
    if (filters.date) collection = db.attendance.where('date').equals(filters.date);
    const records = await collection.toArray();
    set({ records, loading: false });
  },

  getRecordsForClass: async (className, session, semester, date) => {
    return await db.attendance
      .where({ className, session, semester: Number(semester), date })
      .toArray();
  },

  markAttendance: async (studentId, className, session, semester, date, status) => {
    const existing = await db.attendance
      .where({ studentId, className, session, semester: Number(semester), date })
      .first();
    if (existing) {
      await db.attendance.update(existing.id, { status });
      return existing.id;
    }
    return await db.attendance.add({ studentId, className, session, semester: Number(semester), date, status });
  },

  markBulk: async (records) => {
    let count = 0;
    for (const r of records) {
      try {
        const existing = await db.attendance
          .where({ studentId: r.studentId, className: r.className, session: r.session, semester: Number(r.semester), date: r.date })
          .first();
        if (existing) {
          await db.attendance.update(existing.id, { status: r.status });
        } else {
          await db.attendance.add(r);
        }
        count++;
      } catch { /* skip individual record errors */ }
    }
    const all = await db.attendance.toArray();
    set({ records: all });
    return count;
  },

  calculatePercentage: async (studentId, session, semester) => {
    const all = await db.attendance
      .where({ studentId, session, semester: Number(semester) })
      .toArray();
    if (all.length === 0) return null;
    const present = all.filter((r) => r.status === 'present').length;
    return Math.round((present / all.length) * 10000) / 100;
  },

  getAttendanceByStudent: async (studentId) => {
    return await db.attendance.where('studentId').equals(studentId).toArray();
  },

  calculatePercentageBulk: async (studentIds, session, semester) => {
    const all = await db.attendance
      .where({ session, semester: Number(semester) })
      .toArray();
    const map = {};
    for (const sid of studentIds) {
      const studentRecords = all.filter((r) => r.studentId === sid);
      if (studentRecords.length === 0) {
        map[sid] = null;
      } else {
        const present = studentRecords.filter((r) => r.status === 'present').length;
        map[sid] = Math.round((present / studentRecords.length) * 10000) / 100;
      }
    }
    return map;
  },
}));

export default useAttendanceStore;
