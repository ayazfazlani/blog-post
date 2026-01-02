"use client";

import { useEffect, useState } from "react";
import { getAdsForDisplay, recordAdImpression, recordAdClick } from "@/app/actions/client/ad-actions";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Ad = {
  id: string;
  name: string;
  type: string;
  adCode: string;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  width: string | null;
  height: string | null;
};

interface AdDisplayProps {
  position: string;
  pageType: 'home' | 'blog' | 'category' | 'post' | 'page';
  categoryId?: string;
  className?: string;
}

export function AdDisplay({ position, pageType, categoryId, className }: AdDisplayProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAd() {
      try {
        // Get current domain
        const domain = typeof window !== 'undefined' ? window.location.hostname : undefined;
        const ads = await getAdsForDisplay(position, pageType, domain, categoryId);
        if (ads.length > 0) {
          setAd(ads[0]);
          // Track impression
          await recordAdImpression(ads[0].id);
        }
      } catch (error) {
        console.error('Error loading ad:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAd();
  }, [position, pageType, categoryId]);

  if (isLoading || !ad) {
    return null; // Don't show anything while loading or if no ad
  }

  const handleClick = async () => {
    if (ad.id) {
      await recordAdClick(ad.id);
    }
  };

  const adStyle: React.CSSProperties = {
    width: ad.width || '100%',
    height: ad.height || 'auto',
  };

  // Render image ad if imageUrl is provided
  if (ad.imageUrl) {
    const content = (
      <div style={adStyle} className={cn("relative", className)}>
        <Image
          src={ad.imageUrl}
          alt={ad.altText || ad.name}
          fill={!ad.width && !ad.height}
          width={ad.width ? parseInt(ad.width) : undefined}
          height={ad.height ? parseInt(ad.height) : undefined}
          className="object-contain"
          onClick={handleClick}
        />
      </div>
    );

    if (ad.linkUrl) {
      return (
        <Link
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={cn("block", className)}
        >
          {content}
        </Link>
      );
    }

    return content;
  }

  // Render ad code (HTML/JavaScript)
  if (ad.adCode) {
    return (
      <div
        style={adStyle}
        className={cn("ad-container", className)}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: ad.adCode }}
      />
    );
  }

  return null;
}

