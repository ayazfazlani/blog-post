// lib/get-site-settings.ts
import { connectToDatabase } from "@/lib/mongodb";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteTitle: string;
  seoDescription: string;
  keywords: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  contentType: string;
  language: string;
  revisitDays: number;
  author: string;
  customHeadScripts: string;
  firebaseMessagingSW: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
}

export async function getSiteSettingsForLayout(): Promise<SiteSettings> {
  try {
    await connectToDatabase();
    
    const SiteSettingsModule = await import("@/models/SiteSettings");
    const SiteSettings = SiteSettingsModule.SiteSettings;

    const settings = await SiteSettings.findOne({}).lean();
    
    if (!settings) {
      return {
        siteName: "My Blog",
        siteDescription: "",
        siteTitle: "",
        seoDescription: "",
        keywords: "",
        robotsIndex: true,
        robotsFollow: true,
        contentType: "UTF-8",
        language: "English",
        revisitDays: 1,
        author: "",
        customHeadScripts: "",
        firebaseMessagingSW: "",
        faviconUrl: "",
        metaTitle: "",
        metaDescription: "",
      };
    }

    return {
      siteName: settings.siteName || "My Blog",
      siteDescription: settings.siteDescription || "",
      siteTitle: settings.siteTitle || "",
      seoDescription: settings.seoDescription || "",
      keywords: settings.keywords || "",
      robotsIndex: settings.robotsIndex !== undefined ? settings.robotsIndex : true,
      robotsFollow: settings.robotsFollow !== undefined ? settings.robotsFollow : true,
      contentType: settings.contentType || "UTF-8",
      language: settings.language || "English",
      revisitDays: settings.revisitDays || 1,
      author: settings.author || "",
      customHeadScripts: settings.customHeadScripts || "",
      firebaseMessagingSW: settings.firebaseMessagingSW || "",
      faviconUrl: settings.faviconUrl || "",
      metaTitle: settings.metaTitle || "",
      metaDescription: settings.metaDescription || "",
    };
  } catch (error: any) {
    console.error('Error getting site settings for layout:', error);
    return {
      siteName: "My Blog",
      siteDescription: "",
      siteTitle: "",
      seoDescription: "",
      keywords: "",
      robotsIndex: true,
      robotsFollow: true,
      contentType: "UTF-8",
      language: "English",
      revisitDays: 1,
      author: "",
      customHeadScripts: "",
      firebaseMessagingSW: "",
      faviconUrl: "",
      metaTitle: "",
      metaDescription: "",
    };
  }
}

