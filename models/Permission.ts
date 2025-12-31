import mongoose, { Schema, model, models } from 'mongoose';

const permissionSchema = new Schema({
  name: { type: String, required: true, unique: true }, // unique: true automatically creates an index
}, { timestamps: true });

// Note: No need to add index({ name: 1 }) because unique: true already creates it

// Register model - use mongoose.models to check, models to get existing, model to create
const Permission = mongoose.models.Permission || model('Permission', permissionSchema);

export default Permission;