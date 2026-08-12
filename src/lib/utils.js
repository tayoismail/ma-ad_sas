import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a student/parent name by cleaning up problematic characters and normalizing spacing.
 * - Replaces '/' and backslash with spaces
 * - Normalizes multiple spaces to single spaces
 * - Trims leading/trailing whitespace
 */
export function formatStudentName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an Excel (.xlsx) file and trigger a browser download.
 * @param {Array<Object>} data - The rows to export.
 * @param {string} filename - The download filename (without extension).
 * @param {string} [sheetName='Sheet1'] - The worksheet name.
 */
export function downloadExcel(data, filename, sheetName = 'Sheet1') {
  if (!data || data.length === 0) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function semesterLabel(sem) {
  const num = Number(sem);
  return num === 1 ? 'First Semester' : 'Second Semester';
}

export function semesterLabelAr(sem) {
  const num = Number(sem);
  return num === 1 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
}

export function semesterShortLabel(sem) {
  const num = Number(sem);
  return num === 1 ? 'ف1' : 'ف2';
}
