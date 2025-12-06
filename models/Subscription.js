import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, unique: true, required: true },
  expirationTime: { type: Number, required: false },
  keys: {
    p256dh: String,
    auth: String
  },
  preferences: {
    
    daily: { type: Boolean, default: false },   
    fasting: { type: Boolean, default: false },
    whiteDays: { type: Boolean, default: false }
  }
});

export default mongoose.model('Subscription', SubscriptionSchema);