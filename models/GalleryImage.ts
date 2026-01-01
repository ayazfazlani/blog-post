import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true });

// Index for faster lookups
galleryImageSchema.index({ createdAt: -1 });

export default mongoose.models.GalleryImage || mongoose.model('GalleryImage', galleryImageSchema);
