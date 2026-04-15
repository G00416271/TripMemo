import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'system'],
    default: 'message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GroupMessage', groupMessageSchema);