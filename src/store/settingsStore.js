import { create } from 'zustand';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultSettings = {
  schoolName: "MA'AD AHLIL AATHAR",
  schoolNameArabic: 'معهد أهل الأثر',
  address: 'No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State',
  phones: '08033719211, 08034660100, 08062837011',
  mission: "Elevating The Religion with Qur'an and Sunnah Upon the way of the Salaf",
  currentSession: '2024/2025',
  currentSemester: 1,
  useAttendanceUpgrade: false,
  attendanceThreshold: 90,
  attendanceBonus: 2,
  semestersFinalized: {},
  gradingScale: [
    { min: 0, max: 39, grade: 'F', remarkEn: 'Fail', remarkAr: 'راسب' },
    { min: 40, max: 49, grade: 'D', remarkEn: 'Pass', remarkAr: 'مقبول' },
    { min: 50, max: 59, grade: 'C', remarkEn: 'Good', remarkAr: 'جيد' },
    { min: 60, max: 74, grade: 'B', remarkEn: 'Very Good', remarkAr: 'جيد جدا' },
    { min: 75, max: 100, grade: 'A', remarkEn: 'Excellent', remarkAr: 'ممتاز' },
  ],
};

const useSettingsStore = create((set) => ({
  settings: null,
  loading: true,

  loadSettings: async () => {
    const snap = await getDoc(doc(db, 'settings', 'school_settings'));
    if (snap.exists()) {
      set({ settings: { id: snap.id, ...snap.data() }, loading: false });
    } else {
      await setDoc(doc(db, 'settings', 'school_settings'), defaultSettings);
      set({ settings: { id: 'school_settings', ...defaultSettings }, loading: false });
    }
  },

  updateSettings: async (data) => {
    await setDoc(doc(db, 'settings', 'school_settings'), data, { merge: true });
    const snap = await getDoc(doc(db, 'settings', 'school_settings'));
    set({ settings: { id: snap.id, ...snap.data() } });
  },
}));

export default useSettingsStore;
