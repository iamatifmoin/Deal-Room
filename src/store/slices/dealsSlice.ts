import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Deal } from '../../types';

interface DealsState {
  deals: Deal[];
  currentDeal: Deal | null;
  loading: boolean;
  error: string | null;
}

const initialState: DealsState = {
  deals: [],
  currentDeal: null,
  loading: false,
  error: null,
};

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setDeals: (state, action: PayloadAction<Deal[]>) => {
      state.deals = action.payload;
    },
    addDeal: (state, action: PayloadAction<Deal>) => {
      state.deals.unshift(action.payload);
    },
    updateDeal: (state, action: PayloadAction<Deal>) => {
      const index = state.deals.findIndex(deal => deal._id === action.payload._id);
      if (index !== -1) {
        state.deals[index] = action.payload;
      }
      if (state.currentDeal?._id === action.payload._id) {
        state.currentDeal = action.payload;
      }
    },
    setCurrentDeal: (state, action: PayloadAction<Deal | null>) => {
      state.currentDeal = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setDeals, addDeal, updateDeal, setCurrentDeal, setError } = dealsSlice.actions;
export default dealsSlice.reducer;