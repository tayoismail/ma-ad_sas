import Dexie from 'dexie';

const db = new Dexie('MaadSAS');

db.version(6).stores({
  users: '++id, email, role',
  settings: '&key',
  classes: '++id, name, order',
  students: '++id, studentId, name, className, parentEmail',
  subjects: '++id, name, className',
  results: '++id, studentId, className, subjectId, session, semester',
  cumulativeAverages: '++id, studentId, session',
  promotions: '++id, studentId, session, status',
  attendance: '++id, studentId, className, session, semester, date, status',
}).upgrade(async (tx) => {
  const settingsExist = await tx.table('settings').get('school_settings');
  if (!settingsExist) {
    await tx.table('settings').put({
      key: 'school_settings',
      schoolName: 'MA\'AD AHLIL AATHAR',
      address: 'No 3, Mosadoluwa Street, behind Osogbo Local Govt., Oke Baale, Osogbo, Osun State',
      phones: '08033719211, 08034660100, 08062837011',
      mission: 'Elevating The Religion with Qur\'an and Sunnah Upon the way of the Salaf',
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
    });
  }

  await tx.table('classes').count();
});

export default db;
