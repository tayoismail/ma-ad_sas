import { create } from 'zustand';
import db from '../db/database';

const defaultSettings = {
  schoolName: "MA'AD AHLIL AATHAR",
  address: 'No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State',
  phones: '08033719211, 08034660100, 08062837011',
  mission: "Elevating The Religion with Qur'an and Sunnah Upon the way of the Salaf",
  currentSession: '2024/2025',
  currentSemester: 1,
  useAttendanceUpgrade: false,
  semestersFinalized: {},
  gradingScale: [
    { min: 75, max: 100, grade: 'A', remarkEn: 'Excellent', remarkAr: 'ممتاز' },
    { min: 60, max: 74, grade: 'B', remarkEn: 'Very Good', remarkAr: 'جيد جدا' },
    { min: 50, max: 59, grade: 'C', remarkEn: 'Good', remarkAr: 'جيد' },
    { min: 40, max: 49, grade: 'D', remarkEn: 'Pass', remarkAr: 'مقبول' },
    { min: 0, max: 39, grade: 'F', remarkEn: 'Fail', remarkAr: 'راسب' },
  ],
};

const useSettingsStore = create((set) => ({
  settings: null,
  loading: true,

  loadSettings: async () => {
    let settings = await db.settings.get('school_settings');
    if (!settings) {
      await db.settings.put({ key: 'school_settings', ...defaultSettings });
      settings = { key: 'school_settings', ...defaultSettings };
    }
    set({ settings, loading: false });
  },

  updateSettings: async (data) => {
    await db.settings.put({ key: 'school_settings', ...data });
    set({ settings: data });
  },
}));

export default useSettingsStore;
