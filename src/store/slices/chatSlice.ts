import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';

interface ChatState {
  messages: Message[];
  typingUsers: string[];
  unreadCount: number;
}

const initialState: ChatState = {
  messages: [],
  typingUsers: [],
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setTypingUsers: (state, action: PayloadAction<string[]>) => {
      state.typingUsers = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markMessagesAsRead: (state, action: PayloadAction<string[]>) => {
      state.messages = state.messages.map(msg => 
        action.payload.includes(msg._id) ? { ...msg, read: true } : msg
      );
    },
  },
});

export const { setMessages, addMessage, setTypingUsers, setUnreadCount, markMessagesAsRead } = chatSlice.actions;
export default chatSlice.reducer;