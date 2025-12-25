import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // hashed
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Reference to Role
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }], // Direct permissions
}, { timestamps: true });
// Critical: Prevent overwrite errors during hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

