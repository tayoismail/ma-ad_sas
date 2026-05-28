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

  const existing = await tx.table('classes').count();
  if (existing === 0) {
    const defaultClasses = [
      { name: 'Class 1', section: 'A', order: 1, promotionTo: 'Class 2', studentCount: 0 },
      { name: 'Class 2', section: 'A', order: 2, promotionTo: 'Class 3', studentCount: 0 },
      { name: 'Class 3', section: 'A', order: 3, promotionTo: 'Class 4', studentCount: 0 },
      { name: 'Class 4', section: 'A', order: 4, promotionTo: 'Class 5', studentCount: 0 },
      { name: 'Class 5', section: 'A', order: 5, promotionTo: 'Class 6', studentCount: 0 },
      { name: 'Class 6', section: 'A', order: 6, promotionTo: 'Class 7', studentCount: 0 },
      { name: 'Class 7', section: 'A', order: 7, promotionTo: 'Class 8', studentCount: 0 },
      { name: 'Class 8', section: 'A', order: 8, promotionTo: 'Senior 1', studentCount: 0 },
      { name: 'Senior 1', section: 'A', order: 9, promotionTo: 'Senior 2', studentCount: 0 },
      { name: 'Senior 2', section: 'A', order: 10, promotionTo: 'Senior 3', studentCount: 0 },
      { name: 'Senior 3', section: 'A', order: 11, promotionTo: 'Graduated', studentCount: 0 },
    ];
    await tx.table('classes').bulkAdd(defaultClasses);
  }
});

export default db;
