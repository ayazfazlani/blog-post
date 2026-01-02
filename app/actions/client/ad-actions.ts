"use server";

import { getActiveAds } from "@/app/actions/dashboard/ads/ad-actions";
import { trackImpression, trackClick } from "@/app/actions/dashboard/ads/ad-actions";

/**
 * Get active ads for frontend display
 * This is a client-safe action that can be called from components
 */
export async function getAdsForDisplay(
  position: string,
  pageType: 'home' | 'blog' | 'category' | 'post' | 'page',
  domain?: string,
  categoryId?: string
) {
  try {
    const ads = await getActiveAds(position, pageType, domain, categoryId);
    return ads;
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

/**
 * Track ad impression (client-safe)
 */
export async function recordAdImpression(adId: string) {
  try {
    await trackImpression(adId);
  } catch (error) {
    console.error('Error tracking impression:', error);
  }
}

/**
 * Track ad click (client-safe)
 */
export async function recordAdClick(adId: string) {
  try {
    await trackClick(adId);
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

