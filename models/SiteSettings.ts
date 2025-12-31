import mongoose from "mongoose";

// lib/models/SiteSettings.ts
const siteSettingsSchema = new mongoose.Schema({
    siteName: { type: String, required: true, default: "My Blog" },
    siteDescription: { type: String, default: "" },
    logoUrl: { type: String },           // Full delivery URL
    logoPublicId: { type: String },      // Cloudinary public_id (for management)
    faviconUrl: { type: String, default: "" },
    timezone: { type: String, default: "Asia/Karachi" }, // Default to Pakistan timezone
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    postsSchema: { type: String, default: '{"@context": "https://schema.org", "@type": "Article", "headline": "{title}", "description": "{description}", "image": "{image}", "datePublished": "{date}", "author": {"@type": "Person", "name": "Author"}}' },
    pagesSchema: { type: String, default: '{"@context": "https://schema.org", "@type": "WebPage", "name": "{title}", "description": "{description}", "url": "{url}"}' },
    updatedAt: { type: Date, default: Date.now },
  });

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);