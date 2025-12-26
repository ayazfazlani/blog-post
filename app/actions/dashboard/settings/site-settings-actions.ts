// app/actions/site-settings-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// update or create site settings
export async function updateSiteSettings(formData: FormData) {
  try {
    await connectToDatabase();
    
    // Import model AFTER connection (important for serverless)
    const SiteSettingsModule = await import("@/models/SiteSettings");
    const SiteSettings = SiteSettingsModule.SiteSettings;

    const siteName = formData.get("siteName") as string;
    const siteDescription = formData.get("siteDescription") as string;
    const logoUrl = formData.get("logoUrl") as string | null;
    const logoPublicId = formData.get("logoPublicId") as string | null;

    const updateData: any = {
      siteName,
      siteDescription,
      updatedAt: new Date(),
    };

    // Only update logo if provided
    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }
    if (logoPublicId) {
      updateData.logoPublicId = logoPublicId;
    }

    const updated = await SiteSettings.findOneAndUpdate(
      {},
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      settings: {
        siteName: updated.siteName,
        siteDescription: updated.siteDescription,
        logoUrl: updated.logoUrl || null,
        logoPublicId: updated.logoPublicId || null,
      },
    };
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    throw new Error(`Failed to update settings: ${error?.message || 'Unknown error'}`);
  }
}

// get site settings
export async function getSiteSettings() {
  try {
    await connectToDatabase();
    
    // Import model AFTER connection (important for serverless)
    const SiteSettingsModule = await import("@/models/SiteSettings");
    const SiteSettings = SiteSettingsModule.SiteSettings;

    const settings = await SiteSettings.findOne({}).lean();
    if (!settings) {
      return {
        siteName: "My Blog",
        siteDescription: "",
        logoUrl: null,
        logoPublicId: null,
      };
    }

    return {
      siteName: settings.siteName || "My Blog",
      siteDescription: settings.siteDescription || "",
      logoUrl: settings.logoUrl || null,
      logoPublicId: settings.logoPublicId || null,
    };
  } catch (error: any) {
    console.error('Error getting site settings:', error);
    // Return defaults on error
    return {
      siteName: "My Blog",
      siteDescription: "",
      logoUrl: null,
      logoPublicId: null,
    };
  }
}