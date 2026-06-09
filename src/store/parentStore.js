import { create } from 'zustand';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAttendanceStore from './attendanceStore';

const useParentStore = create((set) => ({
  children: [],
  childrenResults: [],
  childrenAttendance: {},
  loading: false,

  loadChildren: async (email) => {
    set({ loading: true });
    const snapshot = await getDocs(query(collection(db, 'students'), where('parentEmail', '==', email)));
    const children = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ children, loading: false });
    return children;
  },

  loadChildrenResults: async (children, session) => {
    const ids = children.map((c) => c.studentId);
    if (ids.length === 0) { set({ childrenResults: [] }); return []; }
    const snapshot = await getDocs(query(collection(db, 'results'), where('session', '==', session)));
    const results = snapshot.docs.map((d) => d.data());
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

  getChildCumulative: (studentId, results, totalSubjects, settings, attBySem) => {
    const my = results.filter((r) => r.studentId === studentId);
    const sem1 = my.filter((r) => r.semester === 1);
    const sem2 = my.filter((r) => r.semester === 2);

    const bonus = (score, semester) => {
      if (!settings?.useAttendanceUpgrade) return score;
      const pct = attBySem?.[semester]?.[studentId];
      if (pct != null && pct >= (settings.attendanceThreshold ?? 90)) {
        return Math.min(100, score + (settings.attendanceBonus ?? 2));
      }
      return score;
    };

    const avg = (arr, semester) => {
      if (!arr.length) return null;
      const sum = arr.reduce((s, r) => s + bonus(r.total || 0, semester), 0);
      const denom = totalSubjects || arr.length;
      return sum / denom;
    };
    const s1 = avg(sem1, 1);
    const s2 = avg(sem2, 2);
    if (s1 !== null && s2 !== null) return Math.round(((s1 + s2) / 2) * 100) / 100;
    return s1 ?? s2;
  },
}));

export default useParentStore;
