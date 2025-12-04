import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    unique: true,
    required: true
  },
  expirationTime: {
    type: Number,
    default: null
  },
  keys: {
    p256dh: String,
    auth: String
  }
}, { timestamps: true });


export default mongoose.model('Subscription', SubscriptionSchema);