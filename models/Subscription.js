import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, unique: true, required: true },
  expirationTime: { type: Number, required: false },
  keys: {
    p256dh: String,
    auth: String
  },
  // 👇 AJOUTE CECI
  preferences: {
    daily: { type: Boolean, default: true },   // Rappel de 22h
    fasting: { type: Boolean, default: false } // Rappel Jeûne (Lun/Jeu)
  }
});

export default mongoose.model('Subscription', SubscriptionSchema);