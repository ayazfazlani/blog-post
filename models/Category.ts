// models/Category.ts
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // unique: true automatically creates an index
//   slug: { type: String, required: true, unique: true },
//   description: { type: String },
}, { timestamps: true });

// Note: No need to add index({ name: 1 }) because unique: true already creates it

export default mongoose.models.Category || mongoose.model('Category', categorySchema);