import { create } from 'zustand';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateGrade, calculateTotal } from '../lib/grading';

async function getAttendancePct(studentId, session, semester) {
  const snapshot = await getDocs(
    query(collection(db, 'attendance'), where('studentId', '==', studentId), where('session', '==', session), where('semester', '==', semester))
  );
  const records = snapshot.docs.map((d) => d.data());
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

    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const students = studentsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const resultsSnapshot = await getDocs(query(collection(db, 'results'), where('session', '==', session)));
    const results = resultsSnapshot.docs.map((d) => d.data());

    const settingsSnap = await getDoc(doc(db, 'settings', 'school_settings'));
    const settings = settingsSnap.exists() ? settingsSnap.data() : null;
    const scale = settings?.gradingScale;
    const useAttendance = settings?.useAttendanceUpgrade;
    const attendanceThreshold = settings?.attendanceThreshold ?? 90;
    const attendanceBonus = settings?.attendanceBonus ?? 2;

    const classesSnapshot = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    const classesList = classesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    const allSubjects = subjectsSnapshot.docs.map((d) => d.data());
    const classSubjectCount = {};
    for (const s of allSubjects) {
      classSubjectCount[s.className] = (classSubjectCount[s.className] || 0) + 1;
    }

    const data = [];

    for (const student of students) {
      const studentResults = results.filter((r) => r.studentId === student.studentId);
      const sem1 = studentResults.filter((r) => r.semester === 1);
      const sem2 = studentResults.filter((r) => r.semester === 2);
      const totalSubjects = classSubjectCount[student.className] || 0;

      const calcSem = async (semResults, semester) => {
        if (semResults.length === 0) return { avg: null, total: 0, count: 0 };
        let total = 0;
        for (const r of semResults) {
          let score = calculateTotal(r.examScore, r.testScore || 0);
          if (useAttendance) {
            const attPct = await getAttendancePct(student.studentId, session, semester);
            if (attPct !== null && attPct >= attendanceThreshold) {
              score = Math.min(100, score + attendanceBonus);
            }
          }
          total += score;
        }
        const denom = totalSubjects || semResults.length;
        return { avg: Math.round((total / denom) * 100) / 100, total, count: denom };
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

    set({ cumulativeData: data, loading: false });
    return data;
  },

  loadPromotions: async (session) => {
    const promoSnapshot = await getDocs(query(collection(db, 'promotions'), where('session', '==', session)));
    const promotions = promoSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    set({ promotions });
  },

  confirmPromotion: async (studentId, session) => {
    const promoSnapshot = await getDocs(query(collection(db, 'promotions'), where('studentId', '==', studentId), where('session', '==', session)));
    const existing = promoSnapshot.docs[0];

    if (existing) {
      await updateDoc(doc(db, 'promotions', existing.id), { status: 'confirmed' });
    } else {
      await addDoc(collection(db, 'promotions'), { studentId, session, status: 'confirmed' });
    }

    const { cumulativeData } = get();
    const cum = cumulativeData.find((d) => d.studentId === studentId);
    if (cum) {
      const studentSnap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
      for (const s of studentSnap.docs) {
        await updateDoc(doc(db, 'students', s.id), { className: cum.promoteTo });
      }
    }

    const all = await getDocs(query(collection(db, 'promotions'), where('session', '==', session)));
    set({ promotions: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },

  confirmAll: async (session) => {
    const { cumulativeData } = get();
    for (const d of cumulativeData) {
      const promoSnapshot = await getDocs(query(collection(db, 'promotions'), where('studentId', '==', d.studentId), where('session', '==', session)));
      const existing = promoSnapshot.docs[0];
      if (existing) {
        await updateDoc(doc(db, 'promotions', existing.id), { status: 'confirmed' });
      } else {
        await addDoc(collection(db, 'promotions'), { studentId: d.studentId, session, status: 'confirmed' });
      }

      const studentSnap = await getDocs(query(collection(db, 'students'), where('studentId', '==', d.studentId)));
      for (const s of studentSnap.docs) {
        await updateDoc(doc(db, 'students', s.id), { className: d.promoteTo });
      }
    }
    const all = await getDocs(query(collection(db, 'promotions'), where('session', '==', session)));
    set({ promotions: all.docs.map((d) => ({ id: d.id, ...d.data() })) });
  },
}));

export default usePromotionStore;
