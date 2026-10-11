import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // stored lowercase; the unique index is what really stops two accounts sharing an email
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    // set when the password is reset; login tokens issued before this moment stop working
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
