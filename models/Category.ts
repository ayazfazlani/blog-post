// models/Category.ts
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }, // unique: true automatically creates an index
  description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);