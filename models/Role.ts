import mongoose, { Schema, model, models } from 'mongoose';

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g., "admin", "user"
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
}, { timestamps: true });

// Add indexes for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ permissions: 1 });

// Register model - use mongoose.models to check, models to get existing, model to create
const Role = mongoose.models.Role || model('Role', roleSchema);

export default Role;