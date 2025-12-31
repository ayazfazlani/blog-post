// app/actions/site-settings-actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";

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
    
    const SiteSettingsModule = await import("@/models/SiteSettings");
    const SiteSettings = SiteSettingsModule.SiteSettings;

    // Extract all form values
    const siteName = (formData.get("siteName") as string) || "My Blog";
    const siteDescription = (formData.get("siteDescription") as string) || "";
    const faviconUrl = (formData.get("faviconUrl") as string) || "";
    const timezone = (formData.get("timezone") as string) || "Asia/Karachi";
    const metaTitle = (formData.get("metaTitle") as string) || "";
    const metaDescription = (formData.get("metaDescription") as string) || "";
    const postsSchema = (formData.get("postsSchema") as string) || "";
    const pagesSchema = (formData.get("pagesSchema") as string) || "";
    const logoUrl = (formData.get("logoUrl") as string) || null;
    const logoPublicId = (formData.get("logoPublicId") as string) || null;

    // Update or create settings
    const updated = await SiteSettings.findOneAndUpdate(
      {},
      {
        $set: {
          siteName,
          siteDescription,
          faviconUrl,
          timezone,
          metaTitle,
          metaDescription,
          postsSchema,
          pagesSchema,
          logoUrl,
          logoPublicId,
          updatedAt: new Date(),
        }
      },
      { upsert: true, new: true, lean: true }
    );

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/dashboard/settings");
    revalidateTag("posts");
    revalidateTag("settings");

    // Return updated settings
    return {
      success: true,
      settings: {
        siteName: updated?.siteName || "My Blog",
        siteDescription: updated?.siteDescription || "",
        logoUrl: updated?.logoUrl || null,
        logoPublicId: updated?.logoPublicId || null,
        faviconUrl: updated?.faviconUrl || "",
        timezone: updated?.timezone || "Asia/Karachi",
        metaTitle: updated?.metaTitle || "",
        metaDescription: updated?.metaDescription || "",
        postsSchema: updated?.postsSchema || "",
        pagesSchema: updated?.pagesSchema || "",
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
    
    const SiteSettingsModule = await import("@/models/SiteSettings");
    const SiteSettings = SiteSettingsModule.SiteSettings;

    const settings = await SiteSettings.findOne({}).lean();
    
    if (!settings) {
      return {
        siteName: "My Blog",
        siteDescription: "",
        logoUrl: null,
        logoPublicId: null,
        faviconUrl: "",
        timezone: "Asia/Karachi",
        metaTitle: "",
        metaDescription: "",
        postsSchema: '{"@context": "https://schema.org", "@type": "Article", "headline": "{title}", "description": "{description}", "image": "{image}", "datePublished": "{date}", "author": {"@type": "Person", "name": "Author"}}',
        pagesSchema: '{"@context": "https://schema.org", "@type": "WebPage", "name": "{title}", "description": "{description}", "url": "{url}"}',
      };
    }

    return {
      siteName: settings.siteName || "My Blog",
      siteDescription: settings.siteDescription || "",
      logoUrl: settings.logoUrl || null,
      logoPublicId: settings.logoPublicId || null,
      faviconUrl: settings.faviconUrl || "",
      timezone: settings.timezone || "Asia/Karachi",
      metaTitle: settings.metaTitle || "",
      metaDescription: settings.metaDescription || "",
      postsSchema: settings.postsSchema || '{"@context": "https://schema.org", "@type": "Article", "headline": "{title}", "description": "{description}", "image": "{image}", "datePublished": "{date}", "author": {"@type": "Person", "name": "Author"}}',
      pagesSchema: settings.pagesSchema || '{"@context": "https://schema.org", "@type": "WebPage", "name": "{title}", "description": "{description}", "url": "{url}"}',
    };
  } catch (error: any) {
    console.error('Error getting site settings:', error);
    return {
      siteName: "My Blog",
      siteDescription: "",
      logoUrl: null,
      logoPublicId: null,
      faviconUrl: "",
      timezone: "Asia/Karachi",
      metaTitle: "",
      metaDescription: "",
      postsSchema: '{"@context": "https://schema.org", "@type": "Article", "headline": "{title}", "description": "{description}", "image": "{image}", "datePublished": "{date}", "author": {"@type": "Person", "name": "Author"}}',
      pagesSchema: '{"@context": "https://schema.org", "@type": "WebPage", "name": "{title}", "description": "{description}", "url": "{url}"}',
    };
  }
}

// Clear cache - revalidate all paths and tags
export async function clearCache() {
  try {
    // Revalidate all common paths
    revalidatePath("/");
    revalidatePath("/(blog)", "layout");
    revalidatePath("/dashboard/settings");
    
    // Revalidate all cache tags
    revalidateTag("posts");
    revalidateTag("settings");
    revalidateTag("categories");
    
    // Get all published posts and revalidate their individual paths
    await connectToDatabase();
    const posts = await Post.find({ published: true }).select("slug").lean();
    
    for (const post of posts) {
      if (post.slug) {
        revalidatePath(`/${post.slug}`);
        revalidateTag(`post-${post.slug}`);
      }
    }

    return { success: true, message: "Cache cleared successfully" };
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    throw new Error(`Failed to clear cache: ${error?.message || 'Unknown error'}`);
  }
}

// Fix image URLs - convert localhost URLs to relative paths
export async function fixImageUrls() {
  try {
    await connectToDatabase();
    
    const posts = await Post.find({}).lean();
    let updatedCount = 0;

    for (const post of posts) {
      let updated = false;
      const updateData: any = {};

      // Fix featuredImage
      if (post.featuredImage && typeof post.featuredImage === 'string') {
        const localhostRegex = /https?:\/\/localhost[^"'\s]*/gi;
        const replacer = (match: string): string => {
          // Extract the path from localhost URL
          const url = new URL(match);
          return url.pathname + url.search;
        };
        const fixedUrl = post.featuredImage.replace(localhostRegex, replacer);
        if (fixedUrl !== post.featuredImage) {
          updateData.featuredImage = fixedUrl;
          updated = true;
        }
      }

      // Fix content images
      if (post.content && typeof post.content === 'string') {
        const localhostRegex = /https?:\/\/localhost[^"'\s]*/gi;
        const replacer = (match: string): string => {
          const url = new URL(match);
          return url.pathname + url.search;
        };
        const fixedContent = post.content.replace(localhostRegex, replacer);
        if (fixedContent !== post.content) {
          updateData.content = fixedContent;
          updated = true;
        }
      }

      if (updated) {
        await Post.updateOne({ _id: post._id }, { $set: updateData });
        updatedCount++;
      }
    }

    // Revalidate all posts after fixing URLs
    revalidateTag("posts");
    for (const post of posts) {
      if (post.slug) {
        revalidatePath(`/${post.slug}`);
      }
    }

    return { 
      success: true, 
      message: `Fixed image URLs in ${updatedCount} post(s)` 
    };
  } catch (error: any) {
    console.error('Error fixing image URLs:', error);
    throw new Error(`Failed to fix image URLs: ${error?.message || 'Unknown error'}`);
  }
}