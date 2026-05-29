import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function semesterLabel(sem) {
  const num = Number(sem);
  return num === 1 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
}

export function semesterShortLabel(sem) {
  const num = Number(sem);
  return num === 1 ? 'ف1' : 'ف2';
}
