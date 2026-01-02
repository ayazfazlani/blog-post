import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['banner', 'sidebar', 'inline', 'popup', 'sticky'],
    default: 'banner'
  },
  placement: {
    type: String,
    required: true,
    enum: ['auto', 'custom'],
    default: 'auto'
  },
  position: {
    type: String,
    required: false,
    enum: ['header', 'footer', 'sidebar-top', 'sidebar-bottom', 'content-top', 'content-middle', 'content-bottom', 'between-posts', 'after-post', 'before-post'],
  },
  // Ad content - can be HTML, script, or image
  adCode: { type: String, required: true }, // HTML/JavaScript ad code
  imageUrl: { type: String, default: null }, // For image ads
  linkUrl: { type: String, default: null }, // For image ads with link
  altText: { type: String, default: null }, // For image ads
  
  // Targeting
  domains: [{ type: String }], // Empty array means all domains, otherwise specific domains
  pages: [{ 
    type: String,
    enum: ['home', 'blog', 'category', 'post', 'page', 'all']
  }], // Which pages to show on
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // Specific categories
  
  // Display settings
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  priority: { type: Number, default: 0 }, // Higher priority ads shown first
  
  // Size settings
  width: { type: String, default: null }, // e.g., "728px", "300px", "100%"
  height: { type: String, default: null }, // e.g., "90px", "250px", "auto"
  
  // Statistics
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  
  // Created by
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes for efficient queries
adSchema.index({ isActive: 1, placement: 1, position: 1 });
adSchema.index({ domains: 1 });
adSchema.index({ pages: 1 });
adSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Ad || mongoose.model('Ad', adSchema);

