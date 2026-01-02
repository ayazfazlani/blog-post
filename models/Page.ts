import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, default: '' },
  excerpt: { type: String, default: null },
  published: { type: Boolean, default: false },
  metaTitle: { type: String, default: null },
  metaDescription: { type: String, default: null },
  featuredImage: { type: String, default: null },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: Number, default: 0 }, // For sorting pages
}, { timestamps: true });

// Add indexes for better query performance
pageSchema.index({ published: 1, slug: 1 }); // Compound index for published pages by slug
pageSchema.index({ published: 1, order: 1 }); // Compound index for published pages by order
// Note: slug already has an index from unique: true, so no need for a separate slug index

export default mongoose.models.Page || mongoose.model('Page', pageSchema);

