import { io, Socket } from "socket.io-client";
import { store } from "../store";
import { addMessage, setTypingUsers } from "../store/slices/chatSlice";
import { updateDeal } from "../store/slices/dealsSlice";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = store.getState().auth.token;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    this.socket.on("newMessage", (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on("dealUpdate", (deal) => {
      store.dispatch(updateDeal(deal));
    });

    this.socket.on("userTyping", ({ users }) => {
      store.dispatch(setTypingUsers(users));
    });

    // Video call events
    this.socket.on("videoCallOffer", this.handleVideoCallOffer);
    this.socket.on("videoCallAnswer", this.handleVideoCallAnswer);
    this.socket.on("iceCandidate", this.handleIceCandidate);
    this.socket.on("callEnded", this.handleCallEnded);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinDeal(dealId: string) {
    this.socket?.emit("joinDeal", dealId);
  }

  leaveDeal(dealId: string) {
    this.socket?.emit("leaveDeal", dealId);
  }

  sendMessage(dealId: string, content: string) {
    this.socket?.emit("sendMessage", { dealId, content });
  }

  startTyping(dealId: string) {
    this.socket?.emit("startTyping", dealId);
  }

  stopTyping(dealId: string) {
    this.socket?.emit("stopTyping", dealId);
  }

  // Video call methods
  initiateVideoCall(dealId: string, targetUserId: string) {
    this.socket?.emit("initiateVideoCall", { dealId, targetUserId });
  }

  sendVideoCallOffer(
    dealId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ) {
    this.socket?.emit("videoCallOffer", { dealId, targetUserId, offer });
  }

  sendVideoCallAnswer(
    dealId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit
  ) {
    this.socket?.emit("videoCallAnswer", { dealId, targetUserId, answer });
  }

  sendIceCandidate(
    dealId: string,
    targetUserId: string,
    candidate: RTCIceCandidate
  ) {
    this.socket?.emit("iceCandidate", { dealId, targetUserId, candidate });
  }

  endVideoCall(dealId: string, targetUserId: string) {
    this.socket?.emit("endVideoCall", { dealId, targetUserId });
  }

  private handleVideoCallOffer = (data: any) => {
    // Handle incoming video call offer
    console.log("Received video call offer:", data);
  };

  private handleVideoCallAnswer = (data: any) => {
    // Handle video call answer
    console.log("Received video call answer:", data);
  };

  private handleIceCandidate = (data: any) => {
    // Handle ICE candidate
    console.log("Received ICE candidate:", data);
  };

  private handleCallEnded = (data: any) => {
    // Handle call ended
    console.log("Call ended:", data);
  };

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
