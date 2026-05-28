import { create } from 'zustand';
import db from '../db/database';
import { calculateGrade, calculateTotal } from '../lib/grading';

async function getAttendancePct(studentId, session, semester) {
  const records = await db.attendance.where({ studentId, session, semester }).toArray();
  if (records.length === 0) return null;
  const present = records.filter((r) => r.status === 'present').length;
  return Math.round((present / records.length) * 10000) / 100;
}

const usePromotionStore = create((set, get) => ({
  cumulativeData: [],
  promotions: [],
  loading: false,

  calculateCumulative: async (session) => {
    set({ loading: true });
    const students = await db.students.toArray();
    const results = await db.results.where('session').equals(session).toArray();
    const settings = await db.settings.get('school_settings');
    const scale = settings?.gradingScale;
    const useAttendance = settings?.useAttendanceUpgrade;

    const data = [];

    for (const student of students) {
      const studentResults = results.filter((r) => r.studentId === student.studentId);
      const sem1 = studentResults.filter((r) => r.semester === 1);
      const sem2 = studentResults.filter((r) => r.semester === 2);

      const calcSem = async (semResults, semester) => {
        if (semResults.length === 0) return { avg: null, total: 0, count: 0 };
        let total = 0;
        for (const r of semResults) {
          let score = calculateTotal(r.examScore, r.testScore || 0);
          if (useAttendance) {
            const attPct = await getAttendancePct(student.studentId, session, semester);
            if (attPct !== null && attPct >= 90) {
              score = Math.min(100, score + 2);
            }
          }
          total += score;
        }
        return { avg: Math.round((total / semResults.length) * 100) / 100, total, count: semResults.length };
      };

      const sem1Calc = sem1.length > 0 ? await calcSem(sem1, 1) : { avg: null, total: 0, count: 0 };
      const sem2Calc = sem2.length > 0 ? await calcSem(sem2, 2) : { avg: null, total: 0, count: 0 };

      let cumulative = null;
      if (sem1Calc.avg !== null && sem2Calc.avg !== null) {
        cumulative = Math.round(((sem1Calc.avg + sem2Calc.avg) / 2) * 100) / 100;
      } else if (sem1Calc.avg !== null) {
        cumulative = sem1Calc.avg;
      } else if (sem2Calc.avg !== null) {
        cumulative = sem2Calc.avg;
      }

      const shouldPromote = cumulative !== null && cumulative >= 50;
      const classesList = await db.classes.orderBy('order').toArray();
      const currentClass = classesList.find((c) => c.name === student.className);
      const nextClass = currentClass ? (currentClass.promotionTo || student.className) : student.className;

      data.push({
        studentId: student.studentId,
        studentName: student.name,
        className: student.className,
        sem1Avg: sem1Calc.avg,
        sem2Avg: sem2Calc.avg,
        cumulative,
        grade: cumulative !== null ? calculateGrade(cumulative, scale).grade : '--',
        shouldPromote,
        promoteTo: shouldPromote ? nextClass : student.className,
        status: 'pending',
      });
    }

    // Save cumulative averages to DB
    await db.cumulativeAverages.where('session').equals(session).delete();
    for (const d of data) {
      await db.cumulativeAverages.add({ ...d, session });
    }

    set({ cumulativeData: data, loading: false });
    return data;
  },

  loadPromotions: async (session) => {
    const promotions = await db.promotions.where('session').equals(session).toArray();
    const cumulatives = await db.cumulativeAverages.where('session').equals(session).toArray();
    set({ promotions, cumulativeData: cumulatives });
  },

  confirmPromotion: async (studentId, session) => {
    const existing = await db.promotions.where({ studentId, session }).first();
    if (existing) {
      await db.promotions.update(existing.id, { status: 'confirmed' });
    } else {
      await db.promotions.add({ studentId, session, status: 'confirmed' });
    }
    // Update student's class
    const cum = await db.cumulativeAverages.where({ studentId, session }).first();
    if (cum) {
      await db.students.where('studentId').equals(studentId).modify({ className: cum.promoteTo });
    }
    const all = await db.promotions.where('session').equals(session).toArray();
    set({ promotions: all });
  },

  confirmAll: async (session) => {
    const { cumulativeData } = get();
    for (const d of cumulativeData) {
      const existing = await db.promotions.where({ studentId: d.studentId, session }).first();
      if (!existing) {
        await db.promotions.add({ studentId: d.studentId, session, status: 'confirmed' });
      } else {
        await db.promotions.update(existing.id, { status: 'confirmed' });
      }
      await db.students.where('studentId').equals(d.studentId).modify({ className: d.promoteTo });
    }
    const all = await db.promotions.where('session').equals(session).toArray();
    set({ promotions: all });
  },
}));

export default usePromotionStore;
