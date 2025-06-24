export interface User {
  _id: string;
  username: string;
  email: string;
  role: "buyer" | "seller";
  avatar?: string;
  createdAt: string;
}

export interface Deal {
  _id: string;
  title: string;
  description: string;
  proposedPrice: number;
  currentPrice: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  buyer: User;
  seller?: User;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface Message {
  _id: string;
  dealId: string;
  sender: User;
  content: string;
  createdAt: string;
  timestamp: string;
  read: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface VideoCallState {
  isCallActive: boolean;
  isConnecting: boolean;
  remoteUser: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
