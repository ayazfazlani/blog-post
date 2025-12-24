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

export default mongoose.models.Post || mongoose.model('Post', postSchema);

