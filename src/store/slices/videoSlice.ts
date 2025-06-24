import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoCallState, User } from '../../types';

const initialState: VideoCallState = {
  isCallActive: false,
  isConnecting: false,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setCallActive: (state, action: PayloadAction<boolean>) => {
      state.isCallActive = action.payload;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setRemoteUser: (state, action: PayloadAction<User | null>) => {
      state.remoteUser = action.payload;
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.remoteStream = action.payload;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },
    resetVideoCall: (state) => {
      state.isCallActive = false;
      state.isConnecting = false;
      state.remoteUser = null;
      state.localStream = null;
      state.remoteStream = null;
      state.isMuted = false;
      state.isVideoOff = false;
    },
  },
});

export const {
  setCallActive,
  setConnecting,
  setRemoteUser,
  setLocalStream,
  setRemoteStream,
  toggleMute,
  toggleVideo,
  resetVideoCall,
} = videoSlice.actions;
export default videoSlice.reducer;