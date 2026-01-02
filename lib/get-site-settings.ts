import { SiteSettings } from "@/models/SiteSettings";
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
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
}

export async function getSiteSettingsForLayout(): Promise<SiteSettings> {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({}).lean();
  return settings;
}
