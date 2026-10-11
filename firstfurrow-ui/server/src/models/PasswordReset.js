import mongoose from 'mongoose';

// One row per outstanding "forgot password" link. Only a HASH of the token is stored, so a copy of the
// database cannot be used to reset anyone's password. MongoDB deletes expired rows by itself (TTL index).
const resetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', resetSchema);
