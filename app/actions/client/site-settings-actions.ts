import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export async function getSiteSettings() {
  await connectToDatabase();
  const siteSettings = await SiteSettings.findOne({});
  return siteSettings;
}

