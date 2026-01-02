import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true, index: true },
  email: { type: String, index: true },
  attempts: { type: Number, default: 1 },
  lastAttempt: { type: Date, default: Date.now },
  blockedUntil: { type: Date, default: null },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

// Index for efficient lookups
loginAttemptSchema.index({ ipAddress: 1, lastAttempt: -1 });
loginAttemptSchema.index({ blockedUntil: 1 });

// Auto-cleanup: Remove old attempts after 24 hours
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', loginAttemptSchema);

