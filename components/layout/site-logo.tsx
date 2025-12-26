"use client";

import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

interface SiteLogoProps {
  logoUrl: string | null;
  logoPublicId: string | null;
  siteName: string;
}

export function SiteLogo({ logoUrl, logoPublicId, siteName }: SiteLogoProps) {
  if (logoUrl) {
    // Use CldImage if we have publicId for optimized delivery
    if (logoPublicId) {
      return (
        <CldImage
          src={logoPublicId}
          width={200}
          height={80}
          alt={siteName}
          crop="limit"
          quality="auto"
          format="auto"
          priority
          className="h-12 w-auto"
        />
      );
    }
    
    // Fallback to regular Image for direct URLs
    return (
      <Image
        src={logoUrl}
        alt={siteName}
        width={200}
        height={80}
        className="h-12 w-auto object-contain"
        priority
      />
    );
  }

  // No logo, show site name
  return <h1 className="text-2xl font-bold">{siteName}</h1>;
}

