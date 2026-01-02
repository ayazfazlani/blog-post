import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true,
    index: true 
  },
  name: { type: String, required: true },
  email: { type: String, required: false, default: null },
  content: { type: String, required: true },
  approved: { type: Boolean, default: false, index: true },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null 
  }, // For nested/reply comments
  ipAddress: { type: String }, // For spam prevention
  userAgent: { type: String }, // For spam prevention
}, { timestamps: true });

// Compound indexes for efficient queries
commentSchema.index({ postId: 1, approved: 1, createdAt: -1 }); // For approved comments on a post
commentSchema.index({ approved: 1, createdAt: -1 }); // For admin dashboard (pending comments)

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);

