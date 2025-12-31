import mongoose, { Schema, model, models } from 'mongoose';

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true }, // unique: true automatically creates an index
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
}, { timestamps: true });

// Add indexes for better query performance
// Note: name already has index from unique: true
roleSchema.index({ permissions: 1 });

// Register model - use mongoose.models to check, models to get existing, model to create
const Role = mongoose.models.Role || model('Role', roleSchema);

export default Role;