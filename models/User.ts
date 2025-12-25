import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique: true automatically creates an index
  password: { type: String }, // hashed
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Reference to Role
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }], // Direct permissions
}, { timestamps: true });

// Add indexes for better query performance
// Note: email index is automatically created by unique: true, so we don't need to add it again
userSchema.index({ role: 1 });
userSchema.index({ permissions: 1 });

// Critical: Prevent overwrite errors during hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

