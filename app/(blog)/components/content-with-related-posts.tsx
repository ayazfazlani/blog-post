"use client";

import { ReadOnlyEditor } from "@/components/ui/read-only-editor";
import YouMightAlsoLike from "./you-might-also-like";
import { splitContentAtPercentages } from "@/lib/content-splitter";

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { id: string; name: string } | null;
  createdAt: Date;
};

interface ContentWithRelatedPostsProps {
  content: string;
  relatedPosts33: RelatedPost[]; // Posts for 33% position
  relatedPosts66: RelatedPost[]; // Posts for 66% position
  postCount33: number; // How many posts to show at 33%
  postCount66: number; // How many posts to show at 66%
}

/**
 * Content With Related Posts Component
 * 
 * This component:
 * 1. Splits content at 33% and 66%
 * 2. Renders content parts
 * 3. Inserts "You Might Also Like" at those positions
 * 4. Shows different posts at each location
 * 
 * STEP-BY-STEP HOW IT WORKS:
 * 
 * Step 1: Split content using splitContentAtPercentages()
 * Step 2: Render first part (0-33%)
 * Step 3: Insert "You Might Also Like" component (if needed)
 * Step 4: Render second part (33-66%)
 * Step 5: Insert "You Might Also Like" component (if needed)
 * Step 6: Render third part (66-100%)
 */
export default function ContentWithRelatedPosts({
  content,
  relatedPosts33,
  relatedPosts66,
  postCount33,
  postCount66,
}: ContentWithRelatedPostsProps) {
  // STEP 1: Split content at 33% and 66%
  const contentParts = splitContentAtPercentages(content);

  return (
    <div className="blog-content">
      {/* STEP 2: Render content before 33% */}
      {contentParts.before33 && (
        <ReadOnlyEditor 
          content={contentParts.before33} 
          className="text-foreground"
        />
      )}

      {/* STEP 3: Insert "You Might Also Like" at 33% (if content is long enough) */}
      {contentParts.shouldInsertAt33 && relatedPosts33.length > 0 && (
        <YouMightAlsoLike 
          posts={relatedPosts33} 
          count={postCount33}
        />
      )}

      {/* STEP 4: Render content between 33% and 66% */}
      {contentParts.between33and66 && (
        <ReadOnlyEditor 
          content={contentParts.between33and66} 
          className="text-foreground"
        />
      )}

      {/* STEP 5: Insert "You Might Also Like" at 66% (if content is very long) */}
      {contentParts.shouldInsertAt66 && relatedPosts66.length > 0 && (
        <YouMightAlsoLike 
          posts={relatedPosts66} 
          count={postCount66}
        />
      )}

      {/* STEP 6: Render content after 66% */}
      {contentParts.after66 && (
        <ReadOnlyEditor 
          content={contentParts.after66} 
          className="text-foreground"
        />
      )}
    </div>
  );
}

