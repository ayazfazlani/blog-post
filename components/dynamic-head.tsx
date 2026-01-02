// components/dynamic-head.tsx
"use client";

import { useEffect } from 'react';

interface DynamicHeadProps {
  customScripts?: string;
}

export function DynamicHead({ customScripts }: DynamicHeadProps) {
  useEffect(() => {
    if (!customScripts) return;

    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = customScripts;

    // Process all script tags
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy script content
      newScript.textContent = oldScript.textContent;
      
      // Append to head
      document.head.appendChild(newScript);
    });

    // Process other elements (meta, link, etc.)
    const otherElements = tempDiv.querySelectorAll(':not(script)');
    otherElements.forEach((el) => {
      // Clone the element to avoid issues
      const clonedEl = el.cloneNode(true) as HTMLElement;
      document.head.appendChild(clonedEl);
    });
  }, [customScripts]);

  return null; // This component doesn't render anything
}

