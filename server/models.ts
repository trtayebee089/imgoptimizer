import mongoose from 'mongoose';

// --- Users & sessions ---

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  // The product is free; the plan field exists so the UI can show the real plan.
  plan: { type: String, enum: ['free'], default: 'free' },
  termsAcceptedAt: { type: Date },
  // Default optimizer settings (validated by lib/optimizationSettings.sanitizeSettings).
  preferences: {
    optimization: { type: mongoose.Schema.Types.Mixed, default: null },
  },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

const PasswordResetSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

// --- Optimization history ---
// One record per processed file. Only sizes and formats are stored — never image
// content or file names.

const OptimizationRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: String, required: true },
  status: { type: String, enum: ['optimized', 'failed'], required: true },
  originalBytes: { type: Number, required: true, min: 0 },
  outputBytes: { type: Number, required: true, min: 0 },
  inputFormat: { type: String, required: true },
  outputFormat: { type: String, enum: ['webp', 'jpeg', 'png'], required: true },
  mode: { type: String, enum: ['smart', 'basic'], required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
OptimizationRecordSchema.index({ userId: 1, createdAt: -1 });
OptimizationRecordSchema.index({ userId: 1, batchId: 1 });

export const User: mongoose.Model<any> = mongoose.models.User || mongoose.model('User', UserSchema);
export const Session: mongoose.Model<any> = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export const PasswordReset: mongoose.Model<any> = mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);
export const OptimizationRecord: mongoose.Model<any> = mongoose.models.OptimizationRecord || mongoose.model('OptimizationRecord', OptimizationRecordSchema);
