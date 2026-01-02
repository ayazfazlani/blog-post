import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSiteSettings } from '@/app/actions/dashboard/settings/site-settings-actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Default Firebase service worker if none is set (minimal valid version)
    const defaultSW = `// Firebase Cloud Messaging Service Worker
// Replace this with your Firebase configuration
// You can edit this content from the Dashboard Settings page

console.log('Firebase Messaging Service Worker loaded');
console.warn('Please configure Firebase in Dashboard Settings');

// Basic service worker to prevent errors
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});`;

    // Try to read from file first (preferred method)
    let swContent = defaultSW;
    try {
      const swFilePath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
      const fileContent = await fs.readFile(swFilePath, 'utf-8');
      if (fileContent && fileContent.trim().length > 0) {
        swContent = fileContent;
      } else {
        // If file is empty, fall back to database
        const settings = await getSiteSettings();
        swContent = settings.firebaseMessagingSW || defaultSW;
      }
    } catch (fileError) {
      // File doesn't exist or can't be read, fall back to database
      console.log('Firebase SW file not found, falling back to database');
      const settings = await getSiteSettings();
      swContent = settings.firebaseMessagingSW || defaultSW;
    }

    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error serving Firebase service worker:', error);
    
    // Return a valid minimal service worker even on error
    const errorSW = `// Service Worker Error
console.error('Error loading service worker configuration');
self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});`;
    
    return new NextResponse(errorSW, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
      },
    });
  }
}

