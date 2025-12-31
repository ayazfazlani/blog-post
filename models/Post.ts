import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String },
  published: { type: Boolean, default: false },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featuredImage: {
    type: String,
    default: null,
  },
  excerpt: { type: String, default: null },
}, { timestamps: true });

// Add indexes for better query performance
// Note: slug already has index from unique: true, but compound indexes are still useful
postSchema.index({ published: 1, createdAt: -1 }); // For published posts sorted by date
postSchema.index({ published: 1, categoryId: 1, createdAt: -1 }); // For category-filtered published posts
postSchema.index({ published: 1, slug: 1 }); // For published post by slug (compound index - still useful)
postSchema.index({ authorId: 1 });
postSchema.index({ categoryId: 1 });

export default mongoose.models.Post || mongoose.model('Post', postSchema);

