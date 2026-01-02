"use client";

import { AdDisplay } from "./ad-display";

interface AdPlaceholderProps {
  position: string;
  pageType: 'home' | 'blog' | 'category' | 'post' | 'page';
  categoryId?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Ad placeholder component that displays ads in specific positions
 * Use this component throughout your site to place ads
 */
export function AdPlaceholder({ 
  position, 
  pageType, 
  categoryId, 
  className,
  fallback 
}: AdPlaceholderProps) {
  return (
    <div className={className}>
      <AdDisplay 
        position={position} 
        pageType={pageType} 
        categoryId={categoryId}
      />
      {fallback}
    </div>
  );
}

