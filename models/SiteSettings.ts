import mongoose from "mongoose";

// lib/models/SiteSettings.ts
const siteSettingsSchema = new mongoose.Schema({
    siteName: { type: String, required: true, default: "My Blog" },
    siteDescription: { type: String, default: "" },
    logoUrl: { type: String },           // Full delivery URL
    logoPublicId: { type: String },      // Cloudinary public_id (for management)
    updatedAt: { type: Date, default: Date.now },
  });

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);