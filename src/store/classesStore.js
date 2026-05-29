import { create } from 'zustand';
import db from '../db/database';

const useClassesStore = create((set) => ({
  classes: [],
  loading: true,

  loadClasses: async () => {
    const classes = await db.classes.orderBy('order').toArray();
    set({ classes, loading: false });
  },

  addClass: async (cls) => {
    const id = await db.classes.add(cls);
    const all = await db.classes.orderBy('order').toArray();
    set({ classes: all });
    return id;
  },

  updateClass: async (id, data) => {
    await db.classes.update(id, data);
    const all = await db.classes.orderBy('order').toArray();
    set({ classes: all });
  },

  deleteClass: async (id) => {
    await db.classes.delete(id);
    const all = await db.classes.orderBy('order').toArray();
    set({ classes: all });
  },
}));

export default useClassesStore;
