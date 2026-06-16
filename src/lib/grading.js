const defaultScale = [
  { min: 0, max: 39, grade: 'F', remarkEn: 'Fail', remarkAr: 'راسب' },
  { min: 40, max: 49, grade: 'D', remarkEn: 'Pass', remarkAr: 'مقبول' },
  { min: 50, max: 59, grade: 'C', remarkEn: 'Good', remarkAr: 'جيد' },
  { min: 60, max: 74, grade: 'B', remarkEn: 'Very Good', remarkAr: 'جيد جدا' },
  { min: 75, max: 100, grade: 'A', remarkEn: 'Excellent', remarkAr: 'ممتاز' },
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

export function gradeStyle(grade) {
  const colors = {
    A: { text: 'text-emerald-600', bg: 'bg-emerald-100', hex: '#16a34a', gradient: 'linear-gradient(135deg, #22c55e20, #16a34a20)' },
    B: { text: 'text-blue-600', bg: 'bg-blue-100', hex: '#2563eb', gradient: 'linear-gradient(135deg, #3b82f620, #2563eb20)' },
    C: { text: 'text-amber-600', bg: 'bg-amber-100', hex: '#ca8a04', gradient: 'linear-gradient(135deg, #eab30820, #ca8a0420)' },
    D: { text: 'text-orange-600', bg: 'bg-orange-100', hex: '#ea580c', gradient: 'linear-gradient(135deg, #f9731620, #ea580c20)' },
    F: { text: 'text-red-600', bg: 'bg-red-100', hex: '#dc2626', gradient: 'linear-gradient(135deg, #ef444420, #dc262620)' },
  };
  return colors[grade] || { text: 'text-gray-600', bg: 'bg-gray-100', hex: '#6b7280', gradient: 'linear-gradient(135deg, #6b728020, #4b556320)' };
}

export function validateGradingScale(scale) {
  const sorted = [...scale].sort((a, b) => a.min - b.min);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].min > sorted[i].max) {
      return `Grade ${sorted[i].grade}: min cannot be greater than max`;
    }
    if (i > 0 && sorted[i].min !== sorted[i - 1].max + 1) {
      return `Grading scale has a gap between ${sorted[i - 1].grade} (max ${sorted[i - 1].max}) and ${sorted[i].grade} (min ${sorted[i].min})`;
    }
    if (i > 0 && sorted[i].min <= sorted[i - 1].max) {
      return `Grading scale has overlap between ${sorted[i - 1].grade} (max ${sorted[i - 1].max}) and ${sorted[i].grade} (min ${sorted[i].min})`;
    }
  }
  if (sorted.length > 0 && (sorted[0].min !== 0 || sorted[sorted.length - 1].max !== 100)) {
    return 'Grading scale must cover the full range 0-100';
  }
  return null;
}

export function calculateTotal(examScore = 0, testScore = 0) {
  const exam = Math.max(0, Number(examScore) || 0);
  const test = Math.max(0, Number(testScore) || 0);
  return Math.min(100, exam + test);
}
