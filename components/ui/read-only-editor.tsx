"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface ReadOnlyEditorProps {
  content?: string | null
  className?: string
  maxHeight?: string
}

// Clean HTML content before rendering to prevent hydration mismatches
// Uses regex to ensure consistent cleaning on both server and client
function cleanHtmlContent(html: string): string {
  let cleaned = html
  
  // Remove placeholder divs with dashed borders containing "Click to upload"
  cleaned = cleaned.replace(/<div[^>]*style\s*=\s*["'][^"']*border\s*:\s*2px\s+dashed[^"']*["'][^>]*>[\s\S]*?Click\s+to\s+upload[\s\S]*?<\/div>/gi, '')
  cleaned = cleaned.replace(/<div[^>]*style\s*=\s*["'][^"']*border\s*:\s*2px\s+dashed[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
  
  // Remove file input elements
  cleaned = cleaned.replace(/<input[^>]*type\s*=\s*["']file["'][^>]*>[\s\S]*?<\/input>/gi, '')
  cleaned = cleaned.replace(/<input[^>]*type\s*=\s*["']file["'][^>]*\/?>/gi, '')
  
  // Remove empty image row containers (more comprehensive regex)
  cleaned = cleaned.replace(/<div[^>]*class\s*=\s*["'][^"']*image-row-container[^"']*["'][^>]*>\s*<\/div>/gi, '')
  cleaned = cleaned.replace(/<div[^>]*class\s*=\s*["'][^"']*image-row-container[^"']*["'][^>]*>[\s]*<\/div>/gi, '')
  
  return cleaned
}

export function ReadOnlyEditor({
  content,
  className,
  maxHeight,
}: ReadOnlyEditorProps) {
  // Clean content before rendering to ensure server and client match
  const cleanedContent = useMemo(() => {
    if (!content) return null
    return cleanHtmlContent(content)
  }, [content])

  if (!cleanedContent) return null

  return (
    <div suppressHydrationWarning>
      <style dangerouslySetInnerHTML={{
        __html: `
          .readonly-editor-content {
            font-size: 1.125rem !important;
            line-height: 1.75 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content h1 {
            font-size: 2.5em !important;
            font-weight: 800 !important;
            margin: 1.5em 0 0.75em 0 !important;
            line-height: 1.2 !important;
            color: hsl(var(--foreground)) !important;
            letter-spacing: -0.02em !important;
          }
          .readonly-editor-content h2 {
            font-size: 2em !important;
            font-weight: 700 !important;
            margin: 1.25em 0 0.6em 0 !important;
            line-height: 1.3 !important;
            color: hsl(var(--foreground)) !important;
            letter-spacing: -0.01em !important;
          }
          .readonly-editor-content h3 {
            font-size: 1.5em !important;
            font-weight: 600 !important;
            margin: 1em 0 0.5em 0 !important;
            line-height: 1.4 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content h4 {
            font-size: 1.25em !important;
            font-weight: 600 !important;
            margin: 0.875em 0 0.45em 0 !important;
            line-height: 1.4 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content p {
            margin: 1.25em 0 !important;
            line-height: 1.75 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content p:first-child {
            margin-top: 0 !important;
          }
          .readonly-editor-content p:last-child {
            margin-bottom: 0 !important;
          }
          .readonly-editor-content strong,
          .readonly-editor-content b {
            font-weight: 700 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content em,
          .readonly-editor-content i {
            font-style: italic !important;
          }
          .readonly-editor-content u {
            text-decoration: underline !important;
          }
          .readonly-editor-content ul,
          .readonly-editor-content ol {
            margin: 1.25em 0 !important;
            padding-left: 2.5em !important;
          }
          .readonly-editor-content ul {
            list-style-type: disc !important;
          }
          .readonly-editor-content ol {
            list-style-type: decimal !important;
          }
          .readonly-editor-content li {
            margin: 0.5em 0 !important;
            line-height: 1.75 !important;
          }
          .readonly-editor-content li::marker {
            color: hsl(var(--muted-foreground)) !important;
          }
          .readonly-editor-content img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 2rem auto !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          }
          .readonly-editor-content .image-row-container {
            display: flex !important;
            gap: 1rem !important;
            margin: 2rem 0 !important;
            flex-wrap: wrap !important;
          }
          .readonly-editor-content .image-row-container img {
            flex: 1 1 calc(50% - 0.5rem) !important;
            min-width: 200px !important;
            margin: 0 !important;
          }
          .readonly-editor-content blockquote {
            margin: 2em 0 !important;
            padding: 1.5em 1.5em 1.5em 2em !important;
            border-left: 4px solid hsl(var(--primary)) !important;
            background-color: hsl(var(--muted) / 0.3) !important;
            border-radius: 0.5rem !important;
            font-style: italic !important;
            color: hsl(var(--muted-foreground)) !important;
            position: relative !important;
          }
          .readonly-editor-content blockquote::before {
            content: '"' !important;
            font-size: 4em !important;
            line-height: 0.1em !important;
            margin-right: 0.25em !important;
            vertical-align: -0.4em !important;
            color: hsl(var(--primary)) !important;
            opacity: 0.3 !important;
          }
          .readonly-editor-content pre {
            margin: 2em 0 !important;
            overflow-x: auto !important;
            border-radius: 0.5rem !important;
          }
          .readonly-editor-content code {
            display: block !important;
            padding: 1.5rem !important;
            background-color: hsl(var(--muted)) !important;
            border-radius: 0.5rem !important;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
            font-size: 0.875rem !important;
            overflow-x: auto !important;
            line-height: 1.6 !important;
            border: 1px solid hsl(var(--border)) !important;
          }
          .readonly-editor-content a {
            color: hsl(var(--primary)) !important;
            text-decoration: underline !important;
            text-underline-offset: 2px !important;
            transition: color 0.2s !important;
          }
          .readonly-editor-content a:hover {
            color: hsl(var(--primary) / 0.8) !important;
          }
          .readonly-editor-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 2rem 0 !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 0.5rem !important;
            overflow: hidden !important;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important;
          }
          .readonly-editor-content table thead {
            background-color: hsl(var(--muted)) !important;
          }
          .readonly-editor-content table td,
          .readonly-editor-content table th {
            border: 1px solid hsl(var(--border)) !important;
            padding: 1rem !important;
            text-align: left !important;
            vertical-align: top !important;
          }
          .readonly-editor-content table th {
            background-color: hsl(var(--muted)) !important;
            font-weight: 600 !important;
            color: hsl(var(--foreground)) !important;
          }
          .readonly-editor-content table tbody tr {
            transition: background-color 0.15s ease !important;
          }
          .readonly-editor-content table tbody tr:hover {
            background-color: hsl(var(--muted) / 0.5) !important;
          }
          .readonly-editor-content table tbody tr:nth-child(even) {
            background-color: hsl(var(--muted) / 0.2) !important;
          }
          .readonly-editor-content hr {
            margin: 2.5em 0 !important;
            border: none !important;
            border-top: 2px solid hsl(var(--border)) !important;
          }
          /* Hide any placeholder elements */
          .readonly-editor-content div[style*="border: 2px dashed"],
          .readonly-editor-content div[style*="border:2px dashed"] {
            display: none !important;
          }
        `
      }} />
      <div
        className={cn("readonly-editor-content", className, maxHeight && "overflow-auto")}
        {...(maxHeight ? { style: { maxHeight } } : {})}
        dangerouslySetInnerHTML={{ __html: cleanedContent }}
        suppressHydrationWarning
      />
    </div>
  )
}

