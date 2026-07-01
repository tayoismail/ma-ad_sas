import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Lightweight audit trail helper.
 *
 * Design choices (Firestore free-tier friendly):
 *  – Single-doc per batch operation (e.g. saving results for 30 students = 1 audit write, not 30).
 *  – Each entry is small (~300 bytes) so storage impact is minimal.
 *  – Backup / restore intentionally skipped (too many writes).
 */

let _currentUser = null;

/** Called once from authStore after login so we have user info without importing the store into every store file. */
export function setAuditUser(user) {
  _currentUser = user;
}

/**
 * Log a single audit event.
 *
 * @param {string}  action        e.g. "student.create", "results.save_batch", "settings.update"
 * @param {string}  entity        Firestore collection name, e.g. "students", "results"
 * @param {object}  [details]     Arbitrary metadata (className, count, etc.)
 */
export async function auditLog(action, entity, details = {}) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      entity,
      userId: _currentUser?.id || null,
      userName: _currentUser?.name || _currentUser?.email || 'unknown',
      timestamp: new Date().toISOString(),
      details,
    });
  } catch {
    // Audit failures should never block the main operation.
    // Silently swallow – the user action already succeeded.
  }
}
