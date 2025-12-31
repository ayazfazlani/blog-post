# 📖 Content Splitting Guide - Step-by-Step Explanation

This guide explains how "You Might Also Like" sections are inserted at 33% and 66% of content length, with different posts at each location.

---

## 🎯 What We Built

- **Content Splitting**: Split blog content at 33% and 66% positions
- **Smart Insertion**: Insert "You Might Also Like" at calculated positions
- **Different Posts**: Show different posts at 33% and 66% locations
- **Adaptive Display**: 
  - Short content (< 2000 chars): No related posts
  - Medium content (2000-4000 chars): 1 post at 33%
  - Long content (≥ 4000 chars): 1 post at 33% AND 1 post at 66%

---

## 📋 Step-by-Step Implementation

### **Step 1: Create Content Splitter Utility**
**File: `lib/content-splitter.ts`**

#### What This Does:
This utility splits HTML content at specific percentages (33% and 66%) without breaking HTML tags.

#### How It Works:

**A. Remove HTML Tags to Get Text Length:**
```typescript
const plainText = htmlContent.replace(/<[^>]*>/g, '');
const totalLength = plainText.length;
```

**Explanation:**
- `/<[^>]*>/g`: Regex pattern that matches HTML tags
- `replace()`: Removes all tags, leaving only text
- `totalLength`: Total character count of actual text

**Example:**
```html
Input:  "<p>Hello <strong>world</strong></p>"
Output: "Hello world" (length = 11)
```

**B. Calculate 33% and 66% Positions:**
```typescript
const position33 = Math.floor(totalLength * 0.33);
const position66 = Math.floor(totalLength * 0.66);
```

**Explanation:**
- `0.33` = 33% (one-third)
- `0.66` = 66% (two-thirds)
- `Math.floor()`: Rounds down to whole number

**Example:**
```
Total length: 3000 characters
33% position: 990 characters
66% position: 1980 characters
```

**C. Find Safe Split Points:**
```typescript
function findSafeSplitPoint(html: string, targetPosition: number) {
  // Count plain text characters
  // Find nearest safe break (end of word, sentence, or tag)
  // Return position that won't break HTML
}
```

**Why This Matters:**
- Can't split in middle of HTML tag: `<div>content</div>` ❌
- Must split at safe points: end of word, sentence, or after closing tag ✅

**D. Split Content:**
```typescript
const before33 = htmlContent.substring(0, split33);
const between33and66 = htmlContent.substring(split33, split66);
const after66 = htmlContent.substring(split66);
```

**Result:**
- `before33`: Content from start to 33%
- `between33and66`: Content from 33% to 66%
- `after66`: Content from 66% to end

---

### **Step 2: Create Content Renderer Component**
**File: `app/(blog)/components/content-with-related-posts.tsx`**

#### What This Does:
This component renders the split content parts and inserts "You Might Also Like" components at the right positions.

#### How It Works:

**A. Split Content:**
```typescript
const contentParts = splitContentAtPercentages(content);
```

**Returns:**
```typescript
{
  before33: "<p>First third of content...</p>",
  shouldInsertAt33: true,  // Should we show component?
  between33and66: "<p>Middle third...</p>",
  shouldInsertAt66: true,  // Should we show component?
  after66: "<p>Last third...</p>"
}
```

**B. Render Content Parts:**
```typescript
// Render first part (0-33%)
<ReadOnlyEditor content={contentParts.before33} />

// Insert component at 33%
{contentParts.shouldInsertAt33 && (
  <YouMightAlsoLike posts={relatedPosts33} count={postCount33} />
)}

// Render second part (33-66%)
<ReadOnlyEditor content={contentParts.between33and66} />

// Insert component at 66%
{contentParts.shouldInsertAt66 && (
  <YouMightAlsoLike posts={relatedPosts66} count={postCount66} />
)}

// Render third part (66-100%)
<ReadOnlyEditor content={contentParts.after66} />
```

**Visual Flow:**
```
[Content 0-33%]
    ↓
[You Might Also Like - Posts 1-6]
    ↓
[Content 33-66%]
    ↓
[You Might Also Like - Posts 7-12]
    ↓
[Content 66-100%]
```

---

### **Step 3: Update Blog Post Page**
**File: `app/(blog)/[slug]/page.tsx`**

#### What We Did:

**A. Calculate Content Length:**
```typescript
const contentLength = post.content 
  ? post.content.replace(/<[^>]*>/g, '').length 
  : 0;
```

**Explanation:**
- Remove HTML tags
- Count remaining text characters
- This determines how many sections to show

**B. Determine Display Logic:**
```typescript
const isShortContent = contentLength < 2000;      // No posts
const isMediumContent = contentLength >= 2000 && contentLength < 4000;  // 1 post at 33%
const isLongContent = contentLength >= 4000;      // 1 post at 33% + 1 at 66%
```

**C. Fetch Different Posts:**
```typescript
// Fetch 12 posts total
const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

// Split into two groups
const relatedPosts33 = allRelatedPosts.slice(0, 6);   // First 6 for 33%
const relatedPosts66 = allRelatedPosts.slice(6, 12);  // Next 6 for 66%
```

**Why 12 Posts?**
- Ensures we have enough different posts
- First 6 for 33% position
- Next 6 for 66% position
- Posts are shuffled, so they're different

**D. Determine Post Counts:**
```typescript
const postCount33 = isMediumContent || isLongContent ? 1 : 0;
const postCount66 = isLongContent ? 1 : 0;
```

**Logic:**
- Short content: No posts (0)
- Medium content: 1 post at 33% only
- Long content: 1 post at 33% AND 1 post at 66%

**E. Render with Component:**
```typescript
<ContentWithRelatedPosts
  content={post.content}
  relatedPosts33={relatedPosts33}
  relatedPosts66={relatedPosts66}
  postCount33={postCount33}
  postCount66={postCount66}
/>
```

---

## 🔍 How It Works (Complete Flow)

### **Flow Diagram:**

```
User visits blog post
    ↓
Page loads post content
    ↓
Calculate content length
    ↓
< 2000 chars? → No related posts
2000-4000 chars? → Fetch posts, show at 33%
≥ 4000 chars? → Fetch 12 posts, show at 33% and 66%
    ↓
Split content at 33% and 66%
    ↓
Render content parts:
  - Part 1 (0-33%)
  - [You Might Also Like - Posts 1-6]
  - Part 2 (33-66%)
  - [You Might Also Like - Posts 7-12]
  - Part 3 (66-100%)
```

---

## 📊 Content Length Logic

| Content Length | 33% Position | 66% Position | Total Posts |
|---------------|--------------|--------------|-------------|
| < 2000 chars  | ❌ None      | ❌ None      | 0           |
| 2000-4000     | ✅ 1 post    | ❌ None      | 1           |
| ≥ 4000 chars  | ✅ 1 post    | ✅ 1 post    | 2           |

---

## 🎨 Visual Layout

### **Short Content (< 2000 chars):**
```
┌─────────────────────────┐
│   Blog Content          │
│   (No related posts)    │
└─────────────────────────┘
```

### **Medium Content (2000-4000 chars):**
```
┌─────────────────────────┐
│   Content (0-33%)       │
└─────────────────────────┘
┌─────────────────────────┐
│ YOU MIGHT ALSO LIKE     │
│ [Post 1]                │
└─────────────────────────┘
┌─────────────────────────┐
│   Content (33-100%)     │
└─────────────────────────┘
```

### **Long Content (≥ 4000 chars):**
```
┌─────────────────────────┐
│   Content (0-33%)       │
└─────────────────────────┘
┌─────────────────────────┐
│ YOU MIGHT ALSO LIKE     │
│ [Post 1]                │
└─────────────────────────┘
┌─────────────────────────┐
│   Content (33-66%)      │
└─────────────────────────┘
┌─────────────────────────┐
│ YOU MIGHT ALSO LIKE     │
│ [Post 2 - Different]    │
└─────────────────────────┘
┌─────────────────────────┐
│   Content (66-100%)     │
└─────────────────────────┘
```

---

## 🔧 Technical Details

### **Safe Split Point Algorithm:**

```typescript
function findSafeSplitPoint(html, targetPosition) {
  // 1. Count plain text characters (skip HTML tags)
  // 2. When we reach target position:
  //    - Look for next space (end of word)
  //    - Look for next period (end of sentence)
  //    - Look for next HTML tag (safe break)
  // 3. Return the nearest safe break point
}
```

**Why This Matters:**
- Prevents breaking HTML: `<div>con|tent</div>` ❌
- Ensures clean splits: `<div>content</div>|` ✅
- Maintains readability: Splits at word/sentence boundaries

### **Content Splitting Example:**

**Input HTML:**
```html
<p>This is paragraph one.</p>
<p>This is paragraph two.</p>
<p>This is paragraph three.</p>
```

**After Splitting at 33%:**
```typescript
before33: "<p>This is paragraph one.</p>"
// Insert component here
between33and66: "<p>This is paragraph two.</p>"
// Insert component here (if long enough)
after66: "<p>This is paragraph three.</p>"
```

---

## 🎓 Key Concepts Explained

### **1. HTML Parsing:**
- **Problem**: Can't just split at character position (might break tags)
- **Solution**: Count plain text, find safe break points
- **Result**: Clean splits that don't break HTML structure

### **2. Percentage Calculation:**
- **33%**: One-third through content
- **66%**: Two-thirds through content
- **Why These?**: Natural reading break points

### **3. Different Posts:**
- **Fetch 12 posts**: Ensures variety
- **Shuffle**: Randomizes order
- **Split**: First 6 for 33%, next 6 for 66%
- **Result**: Different posts at each location

### **4. Adaptive Display:**
- **Short content**: No posts (would be intrusive)
- **Medium content**: One post (not overwhelming)
- **Long content**: Two posts (keeps readers engaged)

---

## 🐛 Troubleshooting

### **Problem: Content Not Splitting Correctly**

**Check:**
1. Is content length calculated correctly?
2. Are HTML tags being removed properly?

**Solution:**
```typescript
// Debug: Log content length
console.log('Content length:', contentLength);
console.log('33% position:', position33);
console.log('66% position:', position66);
```

### **Problem: Same Posts at Both Locations**

**Check:**
1. Are we fetching enough posts? (Need 12+)
2. Are posts being shuffled?

**Solution:**
```typescript
// Ensure we fetch 12 posts
const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

// Verify split
console.log('Posts 33:', relatedPosts33.length);
console.log('Posts 66:', relatedPosts66.length);
```

### **Problem: HTML Tags Breaking**

**Check:**
1. Is `findSafeSplitPoint` working?
2. Are we splitting at safe positions?

**Solution:**
- The algorithm finds safe break points
- Splits at word/sentence/tag boundaries
- Should not break HTML structure

---

## ✅ Summary

1. **Content Splitter**: Splits HTML at 33% and 66% safely
2. **Content Renderer**: Renders parts with components inserted
3. **Blog Page**: Calculates length, fetches posts, determines display
4. **Different Posts**: Fetches 12, splits into two groups
5. **Adaptive**: Shows posts based on content length

The "You Might Also Like" sections now appear at 33% and 66% of content with different posts at each location! 🎉

---

## 📚 Files Created/Modified

1. **`lib/content-splitter.ts`**: Utility to split content at percentages
2. **`app/(blog)/components/content-with-related-posts.tsx`**: Component that renders split content
3. **`app/(blog)/[slug]/page.tsx`**: Updated to use new component
4. **`app/actions/client/related-posts-actions.ts`**: Already fetches up to 12 posts

---

**Questions?** Check the code comments or ask for clarification!

