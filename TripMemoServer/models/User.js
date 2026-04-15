import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    default: 'User',
  },
  last_name: {
    type: String,
    default: 'User',
  },
  account_type: {
    type: String,
    default: 'user',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },

  friends: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: []
}],
friendRequests: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: []
}],
});

export default mongoose.model('User', userSchema);