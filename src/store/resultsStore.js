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
import useSettingsStore from './settingsStore';

function isFinalized(session, semester) {
  try {
    const settings = useSettingsStore.getState().settings;
    return settings?.semestersFinalized?.[`${session}_sem${Number(semester)}`];
  } catch { return false; }
}

const useResultsStore = create((set) => ({
  results: [],
  loading: true,

  loadResults: async (filters = {}) => {
    let snapshot = await getDocs(collection(db, 'results'));
    let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (filters.className) results = results.filter((r) => r.className === filters.className);
    if (filters.session) results = results.filter((r) => r.session === filters.session);
    if (filters.semester) results = results.filter((r) => r.semester === Number(filters.semester));
    set({ results, loading: false });
  },

  getResultsForClass: async (className, session, semester, subjectId) => {
    const snapshot = await getDocs(collection(db, 'results'));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.className === className && r.session === session && r.semester === Number(semester) && String(r.subjectId) === String(subjectId));
  },

  saveResult: async (data) => {
    if (isFinalized(data.session, data.semester)) {
      throw new Error('This semester has been finalized. Results cannot be modified.');
    }
    const snapshot = await getDocs(collection(db, 'results'));
    const existing = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((r) => r.studentId === data.studentId && String(r.subjectId) === String(data.subjectId) && r.session === data.session && r.semester === Number(data.semester));

    if (existing) {
      await updateDoc(doc(db, 'results', existing.id), data);
      return existing.id;
    }
    const docRef = await addDoc(collection(db, 'results'), data);
    return docRef.id;
  },

  saveResults: async (records) => {
    if (records.length > 0 && isFinalized(records[0].session, records[0].semester)) {
      throw new Error('This semester has been finalized. Results cannot be modified.');
    }
    let success = 0;
    const allSnap = await getDocs(collection(db, 'results'));
    const existingMap = {};
    for (const d of allSnap.docs) {
      const r = d.data();
      const key = `${r.studentId}|${r.subjectId}|${r.session}|${r.semester}`;
      existingMap[key] = d.id;
    }
    for (const r of records) {
      try {
        const key = `${r.studentId}|${r.subjectId}|${r.session}|${r.semester}`;
        if (existingMap[key]) {
          await updateDoc(doc(db, 'results', existingMap[key]), r);
        } else {
          await addDoc(collection(db, 'results'), r);
        }
        success++;
      } catch { /* skip individual record errors */ }
    }
    const all = await getDocs(collection(db, 'results'));
    set({ results: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
    return success;
  },

  deleteResult: async (id) => {
    await deleteDoc(doc(db, 'results', id));
    const all = await getDocs(collection(db, 'results'));
    set({ results: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },

  loadResultsByStudent: async (studentId) => {
    set({ loading: true });
    const snapshot = await getDocs(query(collection(db, 'results'), where('studentId', '==', studentId)));
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ results: data, loading: false });
    return data;
  },
}));

export default useResultsStore;
