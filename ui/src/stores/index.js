import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import createUserSlice from './user';

const useBoundStore = create()((...a) => ({
  ...persist(createUserSlice, {
    name: 'userStore',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
    }),
  })(...a),
}));

export default useBoundStore;
