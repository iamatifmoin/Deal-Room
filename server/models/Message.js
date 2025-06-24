import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

messageSchema.index({ dealId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.model('Message', messageSchema);