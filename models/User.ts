import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // hashed
  role: { type: String, default: 'user' },
}, { timestamps: true });
// Critical: Prevent overwrite errors during hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

