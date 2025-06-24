import Message from "../models/Message.js";
import Deal from "../models/Deal.js";

const activeUsers = new Map();
const typingUsers = new Map();

export default function socketHandlers(io, socket) {
  const userId = socket.user._id.toString();

  // Store active user
  activeUsers.set(userId, {
    socketId: socket.id,
    user: socket.user,
  });

  // Join deal room
  socket.on("joinDeal", async (dealId) => {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) return;

      const hasAccess =
        deal.buyer?._id?.toString() === socket.user?._id?.toString() ||
        deal.seller?._id?.toString() === socket.user?._id?.toString();

      if (hasAccess) {
        socket.join(dealId);
        console.log(`User ${socket.user.username} joined deal ${dealId}`);
      }
    } catch (error) {
      console.error("Join deal error:", error);
    }
  });

  // Leave deal room
  socket.on("leaveDeal", (dealId) => {
    socket.leave(dealId);
    console.log(`User ${socket.user.username} left deal ${dealId}`);
  });

  // Send message
  socket.on("sendMessage", async (data) => {
    try {
      const { dealId, content } = data;

      const deal = await Deal.findById(dealId);
      if (!deal) return;

      const hasAccess =
        deal.buyer?._id?.toString() === socket.user?._id?.toString() ||
        deal.seller?._id?.toString() === socket.user?._id?.toString();
      deal.seller && deal.seller._id.equals(socket.user._id);

      if (!hasAccess) return;

      const message = new Message({
        dealId,
        sender: socket.user._id,
        content,
      });

      await message.save();
      await message.populate("sender", "username email role");

      // Broadcast message to deal room
      io.to(dealId).emit("newMessage", message);

      // Stop typing for this user
      const dealTypingUsers = typingUsers.get(dealId) || new Set();
      dealTypingUsers.delete(userId);
      typingUsers.set(dealId, dealTypingUsers);

      io.to(dealId).emit("userTyping", {
        users: Array.from(dealTypingUsers),
      });
    } catch (error) {
      console.error("Send message error:", error);
    }
  });

  // Typing indicators
  socket.on("startTyping", (dealId) => {
    const dealTypingUsers = typingUsers.get(dealId) || new Set();
    dealTypingUsers.add(userId);
    typingUsers.set(dealId, dealTypingUsers);

    socket.to(dealId).emit("userTyping", {
      users: Array.from(dealTypingUsers).filter((id) => id !== userId),
    });
  });

  socket.on("stopTyping", (dealId) => {
    const dealTypingUsers = typingUsers.get(dealId) || new Set();
    dealTypingUsers.delete(userId);
    typingUsers.set(dealId, dealTypingUsers);

    socket.to(dealId).emit("userTyping", {
      users: Array.from(dealTypingUsers),
    });
  });

  // Video call signaling
  socket.on("initiateVideoCall", (data) => {
    const { dealId, targetUserId } = data;
    const targetUser = activeUsers.get(targetUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("incomingVideoCall", {
        dealId,
        caller: socket.user,
      });
    }
  });

  socket.on("videoCallOffer", (data) => {
    const { dealId, targetUserId, offer } = data;
    const targetUser = activeUsers.get(targetUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("videoCallOffer", {
        dealId,
        offer,
        caller: socket.user,
      });
    }
  });

  socket.on("videoCallAnswer", (data) => {
    const { dealId, targetUserId, answer } = data;
    const targetUser = activeUsers.get(targetUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("videoCallAnswer", {
        dealId,
        answer,
        answerer: socket.user,
      });
    }
  });

  socket.on("iceCandidate", (data) => {
    const { dealId, targetUserId, candidate } = data;
    const targetUser = activeUsers.get(targetUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("iceCandidate", {
        dealId,
        candidate,
        from: socket.user,
      });
    }
  });

  socket.on("endVideoCall", (data) => {
    const { dealId, targetUserId } = data;
    const targetUser = activeUsers.get(targetUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("callEnded", {
        dealId,
        endedBy: socket.user,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    activeUsers.delete(userId);

    // Remove from all typing indicators
    for (const [dealId, users] of typingUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        io.to(dealId).emit("userTyping", {
          users: Array.from(users),
        });
      }
    }

    console.log(`User ${socket.user.username} disconnected`);
  });
}
