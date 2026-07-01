import { create } from 'zustand';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import useSettingsStore from './settingsStore';
import { auditLog } from '../lib/audit';

function isFinalized(session, semester) {
  try {
    const settings = useSettingsStore.getState().settings;
    return settings?.semestersFinalized?.[`${session}_sem${Number(semester)}`];
  } catch { return false; }
}

const useAttendanceStore = create((set) => ({
  records: [],
  loading: false,

  loadRecords: async (filters = {}) => {
    set({ loading: true });
    let snapshot = await getDocs(collection(db, 'attendance'));
    let records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (filters.className) records = records.filter((r) => r.className === filters.className);
    if (filters.session) records = records.filter((r) => r.session === filters.session);
    if (filters.semester) records = records.filter((r) => r.semester === Number(filters.semester));
    if (filters.date) records = records.filter((r) => r.date === filters.date);
    set({ records, loading: false });
  },

  getRecordsForClass: async (className, session, semester, date) => {
    const snapshot = await getDocs(collection(db, 'attendance'));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.className === className && r.session === session && r.semester === Number(semester) && r.date === date);
  },

  markAttendance: async (studentId, className, session, semester, date, status) => {
    if (isFinalized(session, semester)) {
      throw new Error('This semester has been finalized. Attendance cannot be modified.');
    }
    const snapshot = await getDocs(collection(db, 'attendance'));
    const existing = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((r) => r.studentId === studentId && r.className === className && r.session === session && r.semester === Number(semester) && r.date === date);

    if (existing) {
      await updateDoc(doc(db, 'attendance', existing.id), { status });
      auditLog('attendance.update', 'attendance', { studentId, className, date, status });
      return existing.id;
    }
    const docRef = await addDoc(collection(db, 'attendance'), { studentId, className, session, semester: Number(semester), date, status });
    auditLog('attendance.create', 'attendance', { studentId, className, date, status });
    return docRef.id;
  },

  markBulk: async (records) => {
    if (records.length > 0 && isFinalized(records[0].session, records[0].semester)) {
      throw new Error('This semester has been finalized. Attendance cannot be modified.');
    }
    let count = 0;
    let created = 0;
    let updated = 0;
    const allSnap = await getDocs(collection(db, 'attendance'));
    const existingMap = {};
    for (const d of allSnap.docs) {
      const r = d.data();
      const key = `${r.studentId}|${r.className}|${r.session}|${r.semester}|${r.date}`;
      existingMap[key] = d.id;
    }
    let failed = 0;
    for (const r of records) {
      try {
        const key = `${r.studentId}|${r.className}|${r.session}|${r.semester}|${r.date}`;
        if (existingMap[key]) {
          await updateDoc(doc(db, 'attendance', existingMap[key]), { status: r.status });
          updated++;
        } else {
          await addDoc(collection(db, 'attendance'), r);
          created++;
        }
        count++;
      } catch { failed++; }
    }
    if (count > 0) auditLog('attendance.mark_bulk', 'attendance', { total: records.length, created, updated, failed, className: records[0]?.className, session: records[0]?.session, semester: records[0]?.semester, date: records[0]?.date });
    const all = await getDocs(collection(db, 'attendance'));
    set({ records: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    if (failed > 0) console.warn(`Attendance: ${failed} of ${records.length} records failed to save`);
    return count;
  },

  calculatePercentage: async (studentId, session, semester) => {
    const snapshot = await getDocs(
      query(collection(db, 'attendance'), where('studentId', '==', studentId), where('session', '==', session), where('semester', '==', Number(semester)))
    );
    const records = snapshot.docs.map((d) => d.data());
    if (records.length === 0) return null;
    const present = records.filter((r) => r.status === 'present').length;
    return Math.round((present / records.length) * 10000) / 100;
  },

  getAttendanceByStudent: async (studentId) => {
    const snapshot = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', studentId)));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  calculatePercentageBulk: async (studentIds, session, semester) => {
    const snapshot = await getDocs(
      query(collection(db, 'attendance'), where('session', '==', session), where('semester', '==', Number(semester)))
    );
    const all = snapshot.docs.map((d) => d.data());
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
