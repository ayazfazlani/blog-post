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
    // SEO Settings
    siteTitle: { type: String, default: "", maxlength: 70 }, // Max 70 characters
    seoDescription: { type: String, default: "" },
    keywords: { type: String, default: "" }, // Comma-separated keywords
    robotsIndex: { type: Boolean, default: true }, // Allow robots to index
    robotsFollow: { type: Boolean, default: true }, // Allow robots to follow links
    contentType: { type: String, default: "UTF-8" }, // Content type/encoding
    language: { type: String, default: "English" }, // Primary language
    revisitDays: { type: Number, default: 1 }, // Search engines revisit interval in days
    author: { type: String, default: "" }, // Site author
    customHeadScripts: { type: String, default: "" }, // Custom scripts to add to head
    firebaseMessagingSW: { type: String, default: "" }, // Firebase messaging service worker content
    updatedAt: { type: Date, default: Date.now },
  });

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);