import mongoose, { Schema, model, models } from 'mongoose';

const permissionSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g., "create_post"
}, { timestamps: true });

// Add index for better query performance
permissionSchema.index({ name: 1 });

// Register model - use mongoose.models to check, models to get existing, model to create
const Permission = mongoose.models.Permission || model('Permission', permissionSchema);

export default Permission;