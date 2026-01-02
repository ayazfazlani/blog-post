"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { revalidatePath, revalidateTag } from "next/cache";
import { adSchema } from "@/lib/validation";
import mongoose from "mongoose";

// Get current domain from request or environment
function getCurrentDomain(): string {
  // In production, this would come from the request headers
  // For now, use environment variable or site settings
  // Remove protocol if present
  let domain = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'localhost:3000';
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return domain;
}

// Get ad by ID
export async function getAdById(id: string) {
  try {
    await connectToDatabase();
    const ad = await Ad.findById(id)
      .populate('createdBy', 'name email')
      .populate('categories', 'name')
      .lean();

    if (!ad) return null;

    return {
      id: ad._id.toString(),
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      position: ad.position || null,
      adCode: ad.adCode,
      imageUrl: ad.imageUrl || null,
      linkUrl: ad.linkUrl || null,
      altText: ad.altText || null,
      domains: ad.domains || [],
      pages: ad.pages || [],
      categories: ad.categories ? (ad.categories as any[]).map(cat => cat._id.toString()) : [],
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString() : null,
      endDate: ad.endDate ? new Date(ad.endDate).toISOString() : null,
      priority: ad.priority || 0,
      width: ad.width || null,
      height: ad.height || null,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
    };
  } catch (error: any) {
    console.error('Error fetching ad:', error);
    throw new Error(`Failed to fetch ad: ${error?.message || 'Unknown error'}`);
  }
}

// Get all ads (for dashboard)
export async function getAds() {
  try {
    await connectToDatabase();
    const ads = await Ad.find({})
      .populate('createdBy', 'name email')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return ads.map(ad => ({
      id: ad._id.toString(),
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      position: ad.position || null,
      adCode: ad.adCode,
      imageUrl: ad.imageUrl || null,
      linkUrl: ad.linkUrl || null,
      altText: ad.altText || null,
      domains: ad.domains || [],
      pages: ad.pages || [],
      categories: ad.categories ? (ad.categories as any[]).map(cat => ({
        id: cat._id.toString(),
        name: cat.name,
      })) : [],
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString() : null,
      endDate: ad.endDate ? new Date(ad.endDate).toISOString() : null,
      priority: ad.priority || 0,
      width: ad.width || null,
      height: ad.height || null,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      createdBy: ad.createdBy ? {
        id: (ad.createdBy as any)._id.toString(),
        name: (ad.createdBy as any).name,
        email: (ad.createdBy as any).email,
      } : null,
      createdAt: ad.createdAt ? new Date(ad.createdAt).toISOString() : null,
      updatedAt: ad.updatedAt ? new Date(ad.updatedAt).toISOString() : null,
    }));
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    throw new Error(`Failed to fetch ads: ${error?.message || 'Unknown error'}`);
  }
}

// Get active ads for a specific position and page (for frontend)
export async function getActiveAds(
  position: string,
  pageType: 'home' | 'blog' | 'category' | 'post' | 'page',
  domain?: string,
  categoryId?: string
) {
  try {
    await connectToDatabase();
    const currentDomain = domain || getCurrentDomain();
    const now = new Date();

    // Build query
    const query: any = {
      isActive: true,
      placement: 'auto',
      position: position,
      $and: [
        {
          $or: [
            { pages: 'all' },
            { pages: pageType },
            { pages: { $in: [pageType] } }
          ]
        },
        {
          $or: [
            { domains: { $size: 0 } }, // Empty array = all domains
            { domains: currentDomain },
            { domains: { $regex: currentDomain, $options: 'i' } }
          ]
        },
        {
          $or: [
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    };

    // Add category filter if provided
    if (categoryId && categoryId !== 'all') {
      query.$and.push({
        $or: [
          { categories: { $size: 0 } }, // No categories = all categories
          { categories: new mongoose.Types.ObjectId(categoryId) }
        ]
      });
    }

    const ads = await Ad.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(1) // Get highest priority ad
      .lean();

    return ads.map(ad => ({
      id: ad._id.toString(),
      name: ad.name,
      type: ad.type,
      adCode: ad.adCode,
      imageUrl: ad.imageUrl || null,
      linkUrl: ad.linkUrl || null,
      altText: ad.altText || null,
      width: ad.width || null,
      height: ad.height || null,
    }));
  } catch (error: any) {
    console.error('Error fetching active ads:', error);
    return [];
  }
}

// Create ad
export async function createAd(data: any, userId?: string) {
  try {
    await connectToDatabase();
    const validated = adSchema.safeParse(data);
    
    if (!validated.success) {
      throw new Error(validated.error.issues[0].message);
    }

    const adData: any = {
      ...validated.data,
      domains: validated.data.domains || [],
      pages: validated.data.pages || ['all'],
      categories: validated.data.categories?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
      startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
      endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
    };

    if (userId) {
      adData.createdBy = new mongoose.Types.ObjectId(userId);
    }

    const ad = await Ad.create(adData);

    revalidatePath("/dashboard/ads");
    revalidateTag("ads");

    return {
      success: true,
      ad: {
        id: ad._id.toString(),
        name: ad.name,
      },
    };
  } catch (error: any) {
    console.error('Error creating ad:', error);
    throw new Error(`Failed to create ad: ${error?.message || 'Unknown error'}`);
  }
}

// Update ad
export async function updateAd(id: string, data: any) {
  try {
    await connectToDatabase();
    const validated = adSchema.safeParse(data);
    
    if (!validated.success) {
      throw new Error(validated.error.issues[0].message);
    }

    const ad = await Ad.findById(id);
    if (!ad) {
      throw new Error('Ad not found');
    }

    // Update fields
    ad.name = validated.data.name;
    ad.type = validated.data.type;
    ad.placement = validated.data.placement;
    ad.position = validated.data.position || null;
    ad.adCode = validated.data.adCode;
    ad.imageUrl = validated.data.imageUrl || null;
    ad.linkUrl = validated.data.linkUrl || null;
    ad.altText = validated.data.altText || null;
    ad.domains = validated.data.domains || [];
    ad.pages = validated.data.pages || ['all'];
    ad.categories = validated.data.categories?.map((id: string) => new mongoose.Types.ObjectId(id)) || [];
    ad.isActive = validated.data.isActive ?? true;
    ad.startDate = validated.data.startDate ? new Date(validated.data.startDate) : null;
    ad.endDate = validated.data.endDate ? new Date(validated.data.endDate) : null;
    ad.priority = validated.data.priority || 0;
    ad.width = validated.data.width || null;
    ad.height = validated.data.height || null;

    await ad.save();

    revalidatePath("/dashboard/ads");
    revalidateTag("ads");

    return {
      success: true,
      ad: {
        id: ad._id.toString(),
        name: ad.name,
      },
    };
  } catch (error: any) {
    console.error('Error updating ad:', error);
    throw new Error(`Failed to update ad: ${error?.message || 'Unknown error'}`);
  }
}

// Delete ad
export async function deleteAd(id: string) {
  try {
    await connectToDatabase();
    await Ad.findByIdAndDelete(id);

    revalidatePath("/dashboard/ads");
    revalidateTag("ads");

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting ad:', error);
    throw new Error(`Failed to delete ad: ${error?.message || 'Unknown error'}`);
  }
}

// Toggle ad active status
export async function toggleAdActive(id: string) {
  try {
    await connectToDatabase();
    const ad = await Ad.findById(id);
    if (!ad) {
      throw new Error('Ad not found');
    }

    ad.isActive = !ad.isActive;
    await ad.save();

    revalidatePath("/dashboard/ads");
    revalidateTag("ads");

    return {
      success: true,
      isActive: ad.isActive,
    };
  } catch (error: any) {
    console.error('Error toggling ad status:', error);
    throw new Error(`Failed to toggle ad status: ${error?.message || 'Unknown error'}`);
  }
}

// Track impression
export async function trackImpression(adId: string) {
  try {
    await connectToDatabase();
    await Ad.findByIdAndUpdate(adId, { $inc: { impressions: 1 } });
  } catch (error) {
    console.error('Error tracking impression:', error);
  }
}

// Track click
export async function trackClick(adId: string) {
  try {
    await connectToDatabase();
    await Ad.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

