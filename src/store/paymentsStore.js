import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const usePaymentsStore = create((set) => ({
  payments: [],
  loading: false,

  loadPayments: async (session, semester) => {
    set({ loading: true });
    try {
      let q = collection(db, 'payments');
      if (session) q = query(q, where('session', '==', session));
      if (semester) q = query(q, where('semester', '==', Number(semester)));
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      set({ payments, loading: false });
    } catch {
      set({ payments: [], loading: false });
    }
  },

  getPaymentStatus: (studentId, session, semester) => {
    const payments = usePaymentsStore.getState().payments;
    return payments.find(
      (p) => p.studentId === studentId && p.session === session && p.semester === Number(semester)
    );
  },

  getPaymentStats: (session, semester) => {
    const payments = usePaymentsStore.getState().payments;
    const filtered = payments.filter(
      (p) => p.session === session && p.semester === Number(semester) && p.status === 'completed'
    );
    return {
      total: filtered.length,
      totalAmount: filtered.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  },
}));

export default usePaymentsStore;
