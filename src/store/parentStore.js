import { create } from 'zustand';
import db from '../db/database';
import useAttendanceStore from './attendanceStore';

const useParentStore = create((set, get) => ({
  children: [],
  childrenResults: [],
  childrenAttendance: {},
  loading: false,

  loadChildren: async (email) => {
    set({ loading: true });
    const children = await db.students.where('parentEmail').equals(email).toArray();
    set({ children, loading: false });
    return children;
  },

  loadChildrenResults: async (children, session) => {
    const ids = children.map((c) => c.studentId);
    if (ids.length === 0) { set({ childrenResults: [] }); return []; }
    const results = await db.results
      .where('session')
      .equals(session)
      .toArray();
    const filtered = results.filter((r) => ids.includes(r.studentId));
    set({ childrenResults: filtered });
    return filtered;
  },

  loadChildrenAttendance: async (children, session, semester) => {
    const map = {};
    for (const child of children) {
      const pct = await useAttendanceStore.getState().calculatePercentage(child.studentId, session, semester);
      map[child.studentId] = pct;
    }
    set({ childrenAttendance: map });
    return map;
  },

  getChildCumulative: (studentId, results) => {
    const my = results.filter((r) => r.studentId === studentId);
    const sem1 = my.filter((r) => r.semester === 1);
    const sem2 = my.filter((r) => r.semester === 2);
    const avg = (arr) => arr.length ? arr.reduce((s, r) => s + (r.total || 0), 0) / arr.length : null;
    const s1 = avg(sem1);
    const s2 = avg(sem2);
    if (s1 !== null && s2 !== null) return Math.round(((s1 + s2) / 2) * 100) / 100;
    return s1 ?? s2;
  },
}));

export default useParentStore;
