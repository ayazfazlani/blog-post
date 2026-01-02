// app/actions/site-settings-actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { promises as fs } from "fs";
import path from "path";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to write Firebase service worker to file
async function writeFirebaseSWToFile(content: string) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const swFilePath = path.join(publicDir, 'firebase-messaging-sw.js');
    
    // Ensure public directory exists
    await fs.mkdir(publicDir, { recursive: true });
    
    // Write the file
    await fs.writeFile(swFilePath, content, 'utf-8');
    
    console.log('Successfully wrote Firebase SW to file:', swFilePath);
    return true;
  } catch (error: any) {
    console.error('Error writing Firebase SW to file:', error);
    throw new Error(`Failed to write Firebase service worker file: ${error?.message || 'Unknown error'}`);
  }
}

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
    // SEO Settings
    const siteTitle = (formData.get("siteTitle") as string) || "";
    const seoDescription = (formData.get("seoDescription") as string) || "";
    const keywords = (formData.get("keywords") as string) || "";
    const robotsIndex = formData.get("robotsIndex") === "true" || formData.get("robotsIndex") === "on";
    const robotsFollow = formData.get("robotsFollow") === "true" || formData.get("robotsFollow") === "on";
    const contentType = (formData.get("contentType") as string) || "UTF-8";
    const language = (formData.get("language") as string) || "English";
    const revisitDays = parseInt(formData.get("revisitDays") as string) || 1;
    const author = (formData.get("author") as string) || "";
    const customHeadScripts = (formData.get("customHeadScripts") as string) || "";
    const firebaseMessagingSWValue = formData.get("firebaseMessagingSW");
    const firebaseMessagingSW = firebaseMessagingSWValue ? String(firebaseMessagingSWValue) : "";
    
    // Debug: Log what we received from formData
    console.log('Server: Received firebaseMessagingSW type:', typeof firebaseMessagingSWValue);
    console.log('Server: Received firebaseMessagingSW length:', firebaseMessagingSW?.length || 0);
    console.log('Server: Received firebaseMessagingSW preview:', firebaseMessagingSW?.substring(0, 100) || 'empty');

    // Write Firebase SW to file FIRST (before database save) using the FormData value
    if (firebaseMessagingSW && firebaseMessagingSW.trim().length > 0) {
      try {
        console.log('Server: Writing Firebase SW to file, length:', firebaseMessagingSW.length);
        await writeFirebaseSWToFile(firebaseMessagingSW);
        console.log('Server: Successfully wrote Firebase SW to file');
      } catch (fileError: any) {
        console.error('Server: Error writing Firebase SW to file:', fileError);
        // Don't throw - continue with database save
      }
    }

    // Update or create settings - ensure firebaseMessagingSW is included
    const updateData: any = {
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
      siteTitle,
      seoDescription,
      keywords,
      robotsIndex,
      robotsFollow,
      contentType,
      language,
      revisitDays,
      author,
      customHeadScripts,
      updatedAt: new Date(),
    };
    
    // Explicitly set firebaseMessagingSW - don't let it be omitted
    if (firebaseMessagingSW !== undefined && firebaseMessagingSW !== null) {
      updateData.firebaseMessagingSW = firebaseMessagingSW;
    } else {
      updateData.firebaseMessagingSW = "";
    }
    
    console.log('Server: Update data firebaseMessagingSW length:', updateData.firebaseMessagingSW?.length || 0);
    
    const updated = await SiteSettings.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true, lean: true }
    );

    // Verify the update worked by querying the database again
    const verify = await SiteSettings.findOne({}).lean();
    console.log('Server: Verification query - firebaseMessagingSW length:', verify?.firebaseMessagingSW?.length || 0);
    console.log('Server: Verification query - firebaseMessagingSW preview:', verify?.firebaseMessagingSW?.substring(0, 100) || 'empty');

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/dashboard/settings");
    revalidateTag("posts");
    revalidateTag("settings");
    revalidateTag("firebase-sw"); // New tag for service worker

    // Use the verified value instead of the returned value
    const finalFirebaseSW = verify?.firebaseMessagingSW || updated?.firebaseMessagingSW || firebaseMessagingSW || "";
    console.log('Server: Final firebaseMessagingSW length to return:', finalFirebaseSW?.length || 0);
    
    // Return updated settings
    // Use the values directly from updated (already lean/plain object)
    const returnedSettings = {
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
      siteTitle: updated?.siteTitle || "",
      seoDescription: updated?.seoDescription || "",
      keywords: updated?.keywords || "",
      robotsIndex: updated?.robotsIndex !== undefined ? updated.robotsIndex : true,
      robotsFollow: updated?.robotsFollow !== undefined ? updated.robotsFollow : true,
      contentType: updated?.contentType || "UTF-8",
      language: updated?.language || "English",
      revisitDays: updated?.revisitDays || 1,
      author: updated?.author || "",
      customHeadScripts: updated?.customHeadScripts || "",
      firebaseMessagingSW: finalFirebaseSW,
    };
    
    // Debug: Log what we're returning
    console.log('Server: Returning firebaseMessagingSW length:', returnedSettings.firebaseMessagingSW?.length || 0);
    console.log('Server: Returning firebaseMessagingSW preview:', returnedSettings.firebaseMessagingSW?.substring(0, 100) || 'empty');
    
    return {
      success: true,
      settings: returnedSettings,
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