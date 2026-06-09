import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const SESSION_TIMEOUT_DEFAULT = 2 * 60 * 60 * 1000;
const SESSION_TIMEOUT_REMEMBER = 7 * 24 * 60 * 60 * 1000;
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const session = sessionStorage.getItem('maad_session');
        if (session) {
          try {
            const { lastActivity, remembered } = JSON.parse(session);
            const timeout = remembered ? SESSION_TIMEOUT_REMEMBER : SESSION_TIMEOUT_DEFAULT;
            if (Date.now() - lastActivity > timeout) {
              await signOut(auth);
              sessionStorage.removeItem('maad_session');
              set({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }
          } catch { /* ignore parse error */ }
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Backfill teacherClasses for existing teachers who don't have it yet
            if (userData.role === 'teacher' && userData.teacherSubjects?.length > 0 && !userData.teacherClasses) {
              try {
                const subjectsSnap = await getDocs(collection(db, 'subjects'));
                const allSubjects = subjectsSnap.docs.map((d) => d.data());
                const teacherClasses = [...new Set(
                  allSubjects.filter((s) => userData.teacherSubjects.includes(s.id)).map((s) => s.className)
                )];
                await updateDoc(doc(db, 'users', firebaseUser.uid), { teacherClasses });
                userData.teacherClasses = teacherClasses;
              } catch { /* best-effort backfill */ }
            }
            set({ user: { id: firebaseUser.uid, ...userData }, isAuthenticated: true, isLoading: false });
            get().updateLastActivity();
          } else {
            const profile = {
              name: firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              role: 'admin',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
            set({ user: { id: firebaseUser.uid, ...profile }, isAuthenticated: true, isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  updateLastActivity: () => {
    const session = sessionStorage.getItem('maad_session');
    const remembered = session ? JSON.parse(session).remembered : false;
    sessionStorage.setItem('maad_session', JSON.stringify({ lastActivity: Date.now(), remembered }));
  },

  checkSession: () => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return false;
    const session = sessionStorage.getItem('maad_session');
    if (session) {
      try {
        const { lastActivity, remembered } = JSON.parse(session);
        const timeout = remembered ? SESSION_TIMEOUT_REMEMBER : SESSION_TIMEOUT_DEFAULT;
        if (Date.now() - lastActivity > timeout) {
          signOut(auth);
          return false;
        }
      } catch {
        signOut(auth);
        return false;
      }
    }
    return true;
  },

  login: async (email, password, rememberMe = false) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    const profile = userDoc.data();
    try {
      await updateDoc(doc(db, 'users', userCredential.user.uid), { lastLogin: new Date().toISOString() });
    } catch { /* lastLogin is best-effort */ }
    sessionStorage.setItem('maad_session', JSON.stringify({ lastActivity: Date.now(), remembered: rememberMe }));
    return { id: userCredential.user.uid, ...profile };
  },

  logout: async () => {
    sessionStorage.removeItem('maad_session');
    await signOut(auth);
  },

  getUsers: async () => {
    const snapshot = await getDocs(query(collection(db, 'users'), orderBy('name')));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  addUser: async (data) => {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Failed to create user');
    }
    const uid = result.localId;
    await setDoc(doc(db, 'users', uid), {
      name: data.name,
      email: data.email,
      role: data.role,
      teacherSubjects: data.teacherSubjects || [],
      teacherClasses: data.teacherClasses || [],
      createdAt: new Date().toISOString(),
    });
    return uid;
  },

  updateUser: async (id, data) => {
    const { password: _password, ...profile } = data;
    void _password;
    if (Object.keys(profile).length > 0) {
      await updateDoc(doc(db, 'users', id), profile);
    }
  },

  deleteUser: async (id) => {
    await deleteDoc(doc(db, 'users', id));
  },

  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },
}));

export default useAuthStore;
