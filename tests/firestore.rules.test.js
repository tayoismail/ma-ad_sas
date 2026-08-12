import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules');

const PROJECT_ID = 'demo-mahd-sas';

let testEnv;

/**
 * Build a minimal results record. The rules gate on className, subjectId and
 * sex, so those are the fields that matter for these tests.
 */
const resultData = (overrides = {}) => ({
  studentId: 'S001',
  className: '5A',
  subjectId: 'math5a',
  subjectName: 'Mathematics',
  sex: 'Female',
  session: '2024/2025',
  semester: 1,
  examScore: 80,
  testScore: 15,
  total: 95,
  grade: 'A',
  enteredBy: 'teacher1',
  enteredAt: new Date().toISOString(),
  ...overrides,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(RULES_PATH, 'utf8') },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestoreData();
  // Seed profiles, subjects and a student with rules disabled.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // Admin can do anything.
    await setDoc(doc(db, 'users', 'admin1'), { role: 'admin', name: 'Admin' });

    // Teacher assigned class 5A + Mathematics (math5a) + Female students.
    await setDoc(doc(db, 'users', 'teacher1'), {
      role: 'teacher',
      name: 'Ms A',
      teacherClasses: ['5A'],
      teacherSubjects: ['math5a'],
      teacherSexes: ['Female'],
    });

    // Teacher whose teacherClasses is STALE (does not include 5B) but whose
    // teacherSubjects includes English (eng5b, which lives in class 5B).
    // This mirrors the exact bug teachers hit: UI shows the class from the
    // live subjects list, but the stored teacherClasses array is out of date.
    await setDoc(doc(db, 'users', 'teacherStale'), {
      role: 'teacher',
      name: 'Mr B',
      teacherClasses: ['5A'],
      teacherSubjects: ['eng5b'],
      teacherSexes: ['Male', 'Female'],
    });

    // A plain student (must never write results).
    await setDoc(doc(db, 'users', 'student1'), { role: 'student', name: 'Ada' });

    // Subjects with their owning class.
    await setDoc(doc(db, 'subjects', 'math5a'), { name: 'Mathematics', className: '5A' });
    await setDoc(doc(db, 'subjects', 'eng5b'), { name: 'English', className: '5B' });

    // One student record.
    await setDoc(doc(db, 'students', 'S001'), {
      name: 'Ada Lovelace', studentId: 'S001', className: '5A', sex: 'Female',
    });
  });
});

after(async () => {
  await testEnv.cleanup();
});

// ─── Admin ────────────────────────────────────────────────────────────
test('admin can save results for any class, subject and sex', async () => {
  const admin = testEnv.authenticatedContext('admin1').firestore();
  await assertSucceeds(
    setDoc(doc(admin, 'results', 'r_admin'), resultData({ className: '9Z', subjectId: 'anything', sex: 'Male' })),
  );
});

// ─── Teacher: normal assigned case ────────────────────────────────────
test('teacher can save results for an assigned class + subject + sex', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertSucceeds(
    setDoc(doc(teacher, 'results', 'r1'), resultData()),
  );
});

test('teacher can read results', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertSucceeds(getDoc(doc(teacher, 'results', 'r1')));
});

// ─── Teacher: denials (the security hardenings) ───────────────────────
test('teacher cannot save results for an unassigned class with a blank subjectId', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  // Blank subjectId must NOT bypass the class restriction.
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_hack1'), resultData({ className: '9Z', subjectId: '' })),
  );
});

test('teacher cannot save results for a class their subject does not belong to', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  // math5a lives in 5A — pairing it with className 5B must be denied.
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_hack2'), resultData({ className: '5B', subjectId: 'math5a' })),
  );
});

test('teacher cannot save results for students of an unassigned sex', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_hack3'), resultData({ sex: 'Male' })),
  );
});

test('teacher with no assigned classes and no assigned subjects cannot save results', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'teacherNone'), {
      role: 'teacher', teacherClasses: [], teacherSubjects: [], teacherSexes: ['Female'],
    });
  });
  const teacher = testEnv.authenticatedContext('teacherNone').firestore();
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_hack4'), resultData({ className: '9Z', subjectId: 'zzz' })),
  );
});

// ─── Teacher: the original bug fix (stale teacherClasses) ─────────────
test('teacher with stale teacherClasses can still save via the subject path', async () => {
  const teacher = testEnv.authenticatedContext('teacherStale').firestore();
  // Class path fails (5B not in teacherClasses ['5A']), but the subject path
  // passes: eng5b is assigned to this teacher AND belongs to class 5B.
  await assertSucceeds(
    setDoc(doc(teacher, 'results', 'r_fix'), resultData({ className: '5B', subjectId: 'eng5b', sex: 'Male' })),
  );
});

test('stale teacher still cannot save for a class unrelated to their subjects', async () => {
  const teacher = testEnv.authenticatedContext('teacherStale').firestore();
  // 9Z is neither in teacherClasses nor the class of any assigned subject.
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_hack5'), resultData({ className: '9Z', subjectId: 'eng5b' })),
  );
});

// ─── Authentication & roles ───────────────────────────────────────────
test('unauthenticated users cannot write results', async () => {
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(anon, 'results', 'r_anon'), resultData()));
});

test('students cannot write results', async () => {
  const student = testEnv.authenticatedContext('student1').firestore();
  await assertFails(setDoc(doc(student, 'results', 'r_stu'), resultData()));
});

test('teachers cannot escalate their own role', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertFails(setDoc(doc(teacher, 'users', 'teacher1'), { role: 'admin' }));
});

test('teachers cannot write promotions (admins only)', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertFails(setDoc(doc(teacher, 'promotions', 'p1'), { status: 'confirmed' }));
});

test('authenticated users can append to audit logs but not edit them', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  const logRef = doc(collection(teacher, 'auditLogs'), 'log1');
  await assertSucceeds(setDoc(logRef, { action: 'results.save_batch', at: new Date().toISOString() }));
  await assertFails(setDoc(logRef, { action: 'tampered' }));
});

// ─── Students: admin-only write ───────────────────────────────────────
test('admin can write students', async () => {
  const admin = testEnv.authenticatedContext('admin1').firestore();
  await assertSucceeds(
    setDoc(doc(admin, 'students', 'S002'), { name: 'New Student', studentId: 'S002', className: '5A', sex: 'Male' }),
  );
});

test('teacher cannot write students (admin-only)', async () => {
  const teacher = testEnv.authenticatedContext('teacher1').firestore();
  await assertFails(
    setDoc(doc(teacher, 'students', 'S002'), { name: 'New Student', studentId: 'S002', className: '5A', sex: 'Male' }),
  );
});

// ─── Teachers without assigned classes/sexes are denied ────────────────
test('teacher with empty teacherClasses cannot write attendance', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'teacherNoClass'), {
      role: 'teacher', teacherClasses: [], teacherSubjects: ['math5a'], teacherSexes: ['Female'],
    });
  });
  const teacher = testEnv.authenticatedContext('teacherNoClass').firestore();
  await assertFails(
    addDoc(collection(teacher, 'attendance'), {
      studentId: 'S001', className: '5A', session: '2024/2025', semester: 1, date: '2024-09-01', status: 'present',
    }),
  );
});

test('teacher with empty teacherSexes cannot write results', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'teacherNoSex'), {
      role: 'teacher', teacherClasses: ['5A'], teacherSubjects: ['math5a'], teacherSexes: [],
    });
  });
  const teacher = testEnv.authenticatedContext('teacherNoSex').firestore();
  await assertFails(
    setDoc(doc(teacher, 'results', 'r_nosex'), resultData()),
  );
});
