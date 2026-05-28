import { create } from 'zustand';
import db from '../db/database';

const defaultClasses = [
  { name: 'Class 1', section: 'A', order: 1, promotionTo: 'Class 2', studentCount: 0 },
  { name: 'Class 2', section: 'A', order: 2, promotionTo: 'Class 3', studentCount: 0 },
  { name: 'Class 3', section: 'A', order: 3, promotionTo: 'Class 4', studentCount: 0 },
  { name: 'Class 4', section: 'A', order: 4, promotionTo: 'Class 5', studentCount: 0 },
  { name: 'Class 5', section: 'A', order: 5, promotionTo: 'Class 6', studentCount: 0 },
  { name: 'Class 6', section: 'A', order: 6, promotionTo: 'Class 7', studentCount: 0 },
  { name: 'Class 7', section: 'A', order: 7, promotionTo: 'Class 8', studentCount: 0 },
  { name: 'Class 8', section: 'A', order: 8, promotionTo: 'Senior 1', studentCount: 0 },
  { name: 'Senior 1', section: 'A', order: 9, promotionTo: 'Senior 2', studentCount: 0 },
  { name: 'Senior 2', section: 'A', order: 10, promotionTo: 'Senior 3', studentCount: 0 },
  { name: 'Senior 3', section: 'A', order: 11, promotionTo: 'Graduated', studentCount: 0 },
];

const useClassesStore = create((set, get) => ({
  classes: [],
  loading: true,

  loadClasses: async () => {
    let classes = await db.classes.orderBy('order').toArray();
    if (classes.length === 0) {
      await db.classes.bulkAdd(defaultClasses);
      classes = defaultClasses;
    }
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
