import { create } from 'zustand';
import db from '../db/database';
import { hashPassword, verifyPassword } from '../lib/crypto';

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;
const REMEMBER_ME_DAYS = 7;
const REMEMBER_ME_MS = REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000;

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    await get().migratePasswords();

    let storedUser = null;
    const sessionData = sessionStorage.getItem('maad_user');
    if (sessionData) {
      try { storedUser = JSON.parse(sessionData); } catch { /* ignore parse errors */ }
    }
    if (!storedUser) {
      const localData = localStorage.getItem('maad_user');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.loginTime && Date.now() - parsed.loginTime > REMEMBER_ME_MS) {
            localStorage.removeItem('maad_user');
          } else {
            storedUser = parsed;
          }
        } catch { /* ignore parse errors */ }
      }
    }

    if (storedUser) {
      const session = sessionStorage.getItem('maad_session');
      if (session) {
        try {
          const { lastActivity } = JSON.parse(session);
          if (Date.now() - lastActivity > SESSION_TIMEOUT) {
            sessionStorage.removeItem('maad_user');
            sessionStorage.removeItem('maad_session');
            localStorage.removeItem('maad_user');
            set({ isLoading: false });
            return;
          }
        } catch { /* ignore parse errors */ }
      }
      const exists = await db.users.where('id').equals(storedUser.id).first();
      if (exists) {
        set({ user: exists, isAuthenticated: true, isLoading: false });
        get().updateLastActivity();
        return;
      }
    }
    set({ isLoading: false });
  },

  updateLastActivity: () => {
    sessionStorage.setItem('maad_session', JSON.stringify({ lastActivity: Date.now() }));
  },

  checkSession: () => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return false;
    const session = sessionStorage.getItem('maad_session');
    if (session) {
      try {
        const { lastActivity } = JSON.parse(session);
        if (Date.now() - lastActivity > SESSION_TIMEOUT) {
          get().logout();
          return false;
        }
      } catch {
        get().logout();
        return false;
      }
    }
    return true;
  },

  login: async (email, password, rememberMe = false) => {
    const user = await db.users.where('email').equals(email).first();
    if (!user) throw new Error('Invalid email or password');

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const now = new Date().toISOString();
    await db.users.update(user.id, { lastLogin: now });

    const safeUser = (({ password: _pw, ...rest }) => rest)(user); // eslint-disable-line no-unused-vars
    safeUser.lastLogin = now;

    sessionStorage.setItem('maad_session', JSON.stringify({ lastActivity: Date.now() }));

    const userData = JSON.stringify({ ...safeUser, loginTime: Date.now(), rememberMe });
    if (rememberMe) {
      localStorage.setItem('maad_user', userData);
      sessionStorage.removeItem('maad_user');
    } else {
      sessionStorage.setItem('maad_user', userData);
      localStorage.removeItem('maad_user');
    }

    set({ user: safeUser, isAuthenticated: true });
    return safeUser;
  },

  logout: () => {
    sessionStorage.removeItem('maad_user');
    sessionStorage.removeItem('maad_session');
    localStorage.removeItem('maad_user');
    set({ user: null, isAuthenticated: false });
  },

  getUsers: async () => {
    return await db.users.toArray();
  },

  addUser: async (data) => {
    const existing = await db.users.where('email').equals(data.email).first();
    if (existing) throw new Error('Email already exists');
    const hashedPassword = await hashPassword(data.password);
    const id = await db.users.add({
      ...data,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  updateUser: async (id, data) => {
    const updates = { ...data };
    if (data.password) {
      updates.password = await hashPassword(data.password);
    }
    await db.users.update(id, updates);
  },

  deleteUser: async (id) => {
    await db.users.delete(id);
  },

  resetPassword: async (id, newPassword) => {
    const hashed = await hashPassword(newPassword);
    await db.users.update(id, { password: hashed });
  },

  migratePasswords: async () => {
    const migrated = localStorage.getItem('maad_pwd_migrated');
    if (migrated) return;
    const users = await db.users.toArray();
    let didMigrate = false;
    for (const user of users) {
      if (user.password && !user.password.startsWith('$2')) {
        const hashed = await hashPassword(user.password);
        await db.users.update(user.id, { password: hashed });
        didMigrate = true;
      }
    }
    if (didMigrate) {
      localStorage.setItem('maad_pwd_migrated', '1');
    }
  },

  seedAccounts: async () => {
    const adminPassword = await hashPassword('Admin123');
    const teacherPassword = await hashPassword('Teacher123');
    const studentPassword = await hashPassword('Student123');
    const parentPassword = await hashPassword('Parent123');

    const adminExists = await db.users.where('email').equals('admin@maad.edu').first();
    if (!adminExists) {
      await db.users.add({
        name: 'Admin', email: 'admin@maad.edu', password: adminPassword,
        role: 'admin', createdAt: new Date().toISOString(),
      });
    } else if (!adminExists.password.startsWith('$2')) {
      await db.users.update(adminExists.id, { password: adminPassword });
    }

    const teacherExists = await db.users.where('email').equals('teacher@maad.edu').first();
    if (!teacherExists) {
      await db.users.add({
        name: 'Teacher', email: 'teacher@maad.edu', password: teacherPassword,
        role: 'teacher', createdAt: new Date().toISOString(),
      });
    } else if (!teacherExists.password.startsWith('$2')) {
      await db.users.update(teacherExists.id, { password: teacherPassword });
    }

    const studentExists = await db.users.where('email').equals('student@maad.edu').first();
    if (!studentExists) {
      await db.users.add({
        name: 'Student', email: 'student@maad.edu', password: studentPassword,
        role: 'student', createdAt: new Date().toISOString(),
      });
    } else if (!studentExists.password.startsWith('$2')) {
      await db.users.update(studentExists.id, { password: studentPassword });
    }

    const parentExists = await db.users.where('email').equals('parent@maad.edu').first();
    if (!parentExists) {
      await db.users.add({
        name: 'Parent', email: 'parent@maad.edu', password: parentPassword,
        role: 'parent', createdAt: new Date().toISOString(),
      });
    } else if (!parentExists.password.startsWith('$2')) {
      await db.users.update(parentExists.id, { password: parentPassword });
    }
  },
}));

export default useAuthStore;
