const defaultScale = [
  { min: 75, max: 100, grade: 'A', remarkEn: 'Excellent', remarkAr: 'ممتاز' },
  { min: 60, max: 74, grade: 'B', remarkEn: 'Very Good', remarkAr: 'جيد جدا' },
  { min: 50, max: 59, grade: 'C', remarkEn: 'Good', remarkAr: 'جيد' },
  { min: 40, max: 49, grade: 'D', remarkEn: 'Pass', remarkAr: 'مقبول' },
  { min: 0, max: 39, grade: 'F', remarkEn: 'Fail', remarkAr: 'راسب' },
];

export function calculateGrade(total, scale = defaultScale) {
  const s = scale || defaultScale;
  for (const level of s) {
    if (total >= level.min && total <= level.max) {
      return { grade: level.grade, remarkEn: level.remarkEn, remarkAr: level.remarkAr };
    }
  }
  return { grade: 'F', remarkEn: 'Fail', remarkAr: 'راسب' };
}

export function calculateTotal(examScore = 0, testScore = 0) {
  const exam = Number(examScore) || 0;
  const test = Number(testScore) || 0;
  return Math.min(100, exam + test);
}
