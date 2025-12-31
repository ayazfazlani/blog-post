# 📚 Related Posts - 3 Posts at 33% and 66% Guide

This guide explains how "You Might Also Like" shows **3 posts at each location** (33% and 66%) for blogs with content >= 2000 characters.

---

## 🎯 What We Built

- **3 Posts at 33%**: Shows 3 related posts at 33% of content
- **3 Posts at 66%**: Shows 3 different related posts at 66% of content  
- **Two Times Display**: For content >= 2000 chars, shows at both positions
- **Different Posts**: Each location shows different posts

---

## 📋 Step-by-Step Implementation

### **Step 1: Calculate Content Length**
**File: `app/(blog)/[slug]/page.tsx`**

```typescript
// Remove HTML tags, count text characters
const contentLength = post.content 
  ? post.content.replace(/<[^>]*>/g, '').length 
  : 0;
```

**What This Does:**
- Removes all HTML tags: `<p>`, `<div>`, etc.
- Counts only actual text characters
- Example: `<p>Hello</p>` → `"Hello"` → length = 5

---

### **Step 2: Determine Display Logic**
**File: `app/(blog)/[slug]/page.tsx`**

```typescript
// Show related posts if content >= 2000 characters
const shouldShowRelatedPosts = contentLength >= 2000;
```

**Logic:**
- **< 2000 chars**: No related posts
- **>= 2000 chars**: Show 3 posts at 33% AND 3 posts at 66%

---

### **Step 3: Fetch Posts**
**File: `app/(blog)/[slug]/page.tsx`**

```typescript
// Fetch 12 posts total (shuffled for variety)
const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

// Split into two groups
const relatedPosts33 = allRelatedPosts.slice(0, 6);   // First 6 for 33%
const relatedPosts66 = allRelatedPosts.slice(6, 12);  // Next 6 for 66%
```

**Why 12 Posts?**
- Need 6 posts for 33% position (will show 3)
- Need 6 posts for 66% position (will show 3)
- Total: 12 posts ensures we have enough different posts

**Why Split This Way?**
- First 6 posts → 33% position (shows first 3)
- Next 6 posts → 66% position (shows first 3)
- Ensures different posts at each location

---

### **Step 4: Set Post Counts**
**File: `app/(blog)/[slug]/page.tsx`**

```typescript
// Show 3 posts at each position
const postCount33 = shouldShowRelatedPosts ? 3 : 0; // 3 posts at 33%
const postCount66 = shouldShowRelatedPosts ? 3 : 0; // 3 posts at 66%
```

**What This Does:**
- If content >= 2000 chars: Show 3 posts at 33% AND 3 posts at 66%
- If content < 2000 chars: Show 0 posts (no related posts)

---

### **Step 5: Split Content**
**File: `lib/content-splitter.ts`**

```typescript
// Split content at 33% and 66%
const contentParts = splitContentAtPercentages(content);
```

**Returns:**
```typescript
{
  before33: "Content from start to 33%",
  shouldInsertAt33: true,  // Show component here
  between33and66: "Content from 33% to 66%",
  shouldInsertAt66: true,  // Show component here
  after66: "Content from 66% to end"
}
```

**How It Works:**
1. Removes HTML tags to count text
2. Calculates 33% and 66% positions
3. Finds safe split points (doesn't break HTML)
4. Splits content into 3 parts

---

### **Step 6: Render with Components**
**File: `app/(blog)/components/content-with-related-posts.tsx`**

```typescript
// Render content part 1 (0-33%)
<ReadOnlyEditor content={contentParts.before33} />

// Insert "You Might Also Like" with 3 posts
{contentParts.shouldInsertAt33 && (
  <YouMightAlsoLike posts={relatedPosts33} count={3} />
)}

// Render content part 2 (33-66%)
<ReadOnlyEditor content={contentParts.between33and66} />

// Insert "You Might Also Like" with 3 different posts
{contentParts.shouldInsertAt66 && (
  <YouMightAlsoLike posts={relatedPosts66} count={3} />
)}

// Render content part 3 (66-100%)
<ReadOnlyEditor content={contentParts.after66} />
```

---

### **Step 7: Display Posts**
**File: `app/(blog)/components/you-might-also-like.tsx`**

```typescript
// Take only the number of posts needed (3)
const displayPosts = posts.slice(0, count);

// Render each post
{displayPosts.map((post) => (
  // Post with image, title, category, date
))}
```

**What Happens:**
- Receives array of 6 posts
- Takes first 3 posts: `posts.slice(0, 3)`
- Displays them in a list with images

---

## 🔍 Complete Flow Diagram

```
Blog Post Loads
    ↓
Calculate Content Length
    ↓
>= 2000 chars?
    ↓ YES
Fetch 12 Related Posts
    ↓
Split into Two Groups:
  - Posts 1-6 → 33% position
  - Posts 7-12 → 66% position
    ↓
Split Content at 33% and 66%
    ↓
Render:
  [Content 0-33%]
  [You Might Also Like - Posts 1-3] ← 3 posts
  [Content 33-66%]
  [You Might Also Like - Posts 7-9] ← 3 different posts
  [Content 66-100%]
```

---

## 📊 Visual Layout

### **For Content >= 2000 Characters:**

```
┌─────────────────────────────┐
│   Blog Content (0-33%)       │
│   Paragraph 1...            │
│   Paragraph 2...            │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 🔗 YOU MIGHT ALSO LIKE      │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 1 Title     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 2 Title     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 3 Title     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
┌─────────────────────────────┐
│   Blog Content (33-66%)     │
│   Paragraph 3...            │
│   Paragraph 4...            │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 🔗 YOU MIGHT ALSO LIKE      │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 4 Title     │ │ ← Different posts
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 5 Title     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Image] Post 6 Title     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
┌─────────────────────────────┐
│   Blog Content (66-100%)    │
│   Paragraph 5...            │
│   Paragraph 6...            │
└─────────────────────────────┘
```

---

## 🎓 Key Concepts Explained

### **1. Why 3 Posts?**
- **Not too many**: Doesn't overwhelm the reader
- **Not too few**: Provides good variety
- **Optimal**: Good balance for engagement

### **2. Why Two Locations?**
- **33%**: Early engagement (reader is still interested)
- **66%**: Re-engagement (reader might be losing interest)
- **Result**: Keeps readers engaged throughout long articles

### **3. Why Different Posts?**
- **Variety**: Shows different content at each location
- **Interest**: Reader sees new options
- **Engagement**: More chances to find interesting content

### **4. Content Length Threshold:**
- **2000 characters**: About 300-400 words
- **Why this number?**: Long enough to justify related posts
- **Not intrusive**: Doesn't interrupt short articles

---

## 🔧 Code Breakdown

### **Post Count Logic:**
```typescript
// If content >= 2000 chars, show 3 posts at each location
const postCount33 = shouldShowRelatedPosts ? 3 : 0;
const postCount66 = shouldShowRelatedPosts ? 3 : 0;
```

**Explanation:**
- `shouldShowRelatedPosts`: true if content >= 2000 chars
- If true: Show 3 posts at 33% AND 3 posts at 66%
- If false: Show 0 posts (no related posts)

### **Post Splitting:**
```typescript
// Fetch 12 posts
const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

// Split: First 6 for 33%, Next 6 for 66%
const relatedPosts33 = allRelatedPosts.slice(0, 6);
const relatedPosts66 = allRelatedPosts.slice(6, 12);
```

**Why This Works:**
- `slice(0, 6)`: Gets posts 1-6 (for 33% position)
- `slice(6, 12)`: Gets posts 7-12 (for 66% position)
- Each group has 6 posts, but we only show 3 from each
- Ensures different posts at each location

### **Display Logic:**
```typescript
// In YouMightAlsoLike component
const displayPosts = posts.slice(0, count);
// If count = 3, shows first 3 posts from the array
```

**Example:**
```typescript
// relatedPosts33 has 6 posts: [Post1, Post2, Post3, Post4, Post5, Post6]
// count = 3
// displayPosts = [Post1, Post2, Post3] ← Shows only 3
```

---

## ✅ Summary

1. **Content >= 2000 chars**: Shows related posts
2. **Fetch 12 posts**: Ensures variety
3. **Split into 2 groups**: 6 for 33%, 6 for 66%
4. **Show 3 from each**: 3 posts at 33%, 3 posts at 66%
5. **Different posts**: Each location shows different content
6. **Two times**: Appears at both 33% and 66% positions

---

## 🐛 Troubleshooting

### **Problem: Only 1 Post Showing Instead of 3**

**Check:**
1. Is `postCount33` and `postCount66` set to 3?
2. Are there at least 3 posts in the arrays?
3. Is `count` parameter being passed correctly?

**Debug:**
```typescript
console.log('Post count 33:', postCount33);
console.log('Post count 66:', postCount66);
console.log('Posts 33:', relatedPosts33.length);
console.log('Posts 66:', relatedPosts66.length);
```

**Solution:**
- Verify `postCount33 = 3` and `postCount66 = 3`
- Ensure we're fetching at least 6 posts for each position
- Check that `count` is passed to `YouMightAlsoLike` component

### **Problem: Same Posts at Both Locations**

**Check:**
1. Are we fetching enough posts? (Need 12+)
2. Are posts being split correctly?

**Solution:**
```typescript
// Ensure we fetch 12 posts
const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

// Verify split
console.log('First 6:', allRelatedPosts.slice(0, 6).map(p => p.id));
console.log('Next 6:', allRelatedPosts.slice(6, 12).map(p => p.id));
```

---

## 📝 Current Configuration

- **Posts at 33%**: 3 posts (from first 6 fetched)
- **Posts at 66%**: 3 posts (from next 6 fetched)
- **Total Posts Fetched**: 12 posts
- **Content Threshold**: >= 2000 characters
- **Display Times**: 2 times (at 33% and 66%)

---

**The system now shows 3 posts at each location (33% and 66%) for blogs with content >= 2000 characters!** 🎉

