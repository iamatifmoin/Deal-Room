import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dealsSlice from './slices/dealsSlice';
import chatSlice from './slices/chatSlice';
import videoSlice from './slices/videoSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    deals: dealsSlice,
    chat: chatSlice,
    video: videoSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['video/setLocalStream', 'video/setRemoteStream'],
        ignoredPaths: ['video.localStream', 'video.remoteStream'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;