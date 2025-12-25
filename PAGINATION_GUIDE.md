# Pagination & Load More Feature - Complete Guide

## 📚 Overview

This guide explains how pagination and "Load More" functionality works in the blog application.

## 🎯 What is Pagination?

**Pagination** is a technique to split large datasets into smaller, manageable chunks (pages). Instead of loading all blog posts at once, we load them in batches.

### Benefits:
- ✅ **Faster initial page load** - Only loads first 6 posts
- ✅ **Better performance** - Less data transferred
- ✅ **Better user experience** - Users see content faster
- ✅ **Scalable** - Works with thousands of posts

## 🔧 How It Works

### 1. **Server Action with Pagination** (`app/actions/client/blog-actions.ts`)

```typescript
export async function getPublishedPosts(
    categoryId?: string | null,
    limit: number = 6,    // How many posts per page
    skip: number = 0       // How many posts to skip
)
```

**Key Concepts:**
- **`limit`**: Number of posts to fetch (default: 6)
- **`skip`**: Number of posts to skip (for pagination)
- **`hasMore`**: Boolean indicating if more posts exist

**Example:**
- First page: `limit=6, skip=0` → Gets posts 1-6
- Second page: `limit=6, skip=6` → Gets posts 7-12
- Third page: `limit=6, skip=12` → Gets posts 13-18

### 2. **MongoDB Query with Pagination**

```typescript
const posts = await Post.find(query)
    .limit(limit)      // Only fetch this many posts
    .skip(skip)        // Skip this many posts
    .sort({ createdAt: -1 })
    .lean();
```

**How it works:**
- `.limit(6)` - MongoDB only returns 6 documents
- `.skip(6)` - MongoDB skips the first 6 documents
- This is efficient because MongoDB only processes what you need

### 3. **Client Component with State** (`app/(blog)/components/blog-list-client.tsx`)

```typescript
const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
const [hasMore, setHasMore] = useState(initialHasMore);
```

**State Management:**
- `posts` - Array of all loaded posts (grows as user clicks "Load More")
- `hasMore` - Boolean to show/hide "Load More" button
- `isPending` - Loading state for the button

### 4. **Load More Function**

```typescript
const loadMore = () => {
    startTransition(async () => {
        const result = await getPublishedPosts(categoryId, 6, posts.length);
        setPosts(prev => [...prev, ...result.posts]);  // Append new posts
        setHasMore(result.hasMore);                     // Update hasMore
    });
};
```

**What happens:**
1. User clicks "Load More"
2. Calls `getPublishedPosts` with `skip = posts.length` (current number of posts)
3. Appends new posts to existing array
4. Updates `hasMore` to show/hide button

## 📊 Flow Diagram

```
Initial Load:
┌─────────────────┐
│  Server Page    │
│  (SSR)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ getPublishedPosts│
│ (limit=6, skip=0)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Returns:       │
│  - posts[0-5]   │
│  - hasMore:true │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BlogListClient  │
│ (Client)        │
└─────────────────┘

User Clicks "Load More":
┌─────────────────┐
│  loadMore()     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ getPublishedPosts│
│ (limit=6, skip=6)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Appends:       │
│  posts[6-11]    │
│  Updates hasMore│
└─────────────────┘
```

## 🎓 Key Concepts Explained

### **useState Hook**
```typescript
const [posts, setPosts] = useState(initialPosts);
```
- Stores the current list of posts
- `setPosts` updates the list
- When state changes, React re-renders the component

### **useTransition Hook**
```typescript
const [isPending, startTransition] = useTransition();
```
- Marks the update as non-urgent (better UX)
- `isPending` shows loading state
- Prevents blocking the UI during data fetch

### **Array Spread Operator**
```typescript
setPosts(prev => [...prev, ...result.posts]);
```
- `...prev` - All existing posts
- `...result.posts` - New posts from server
- Combines them into one array

### **Skip Calculation**
```typescript
getPublishedPosts(categoryId, 6, posts.length)
```
- `posts.length` = number of posts already loaded
- This becomes the `skip` value
- Example: If 6 posts loaded, skip=6 to get next 6

## 🔄 Alternative: Traditional Pagination

Instead of "Load More", you could use page numbers:

```typescript
// Page 1: skip=0, limit=6
// Page 2: skip=6, limit=6
// Page 3: skip=12, limit=6

const page = 2;
const skip = (page - 1) * 6;  // skip = 6
```

## 💡 Best Practices

1. **Start with small limit** (6-12 posts) for fast initial load
2. **Use loading states** to show user something is happening
3. **Disable button while loading** to prevent duplicate requests
4. **Show "end" message** when no more posts
5. **Handle errors gracefully** with try-catch

## 🚀 Performance Tips

1. **Use `.lean()`** - Returns plain objects (faster than Mongoose documents)
2. **Index your database** - Add indexes on `createdAt` for faster sorting
3. **Limit fields** - Use `.select()` to only fetch needed fields
4. **Cache results** - Use Next.js revalidation for caching

## 📝 Example: Customizing Page Size

To show 12 posts per page instead of 6:

```typescript
// In blog-actions.ts
export async function getPublishedPosts(
    categoryId?: string | null,
    limit: number = 12,  // Changed from 6 to 12
    skip: number = 0
)

// In blog-list-client.tsx
const result = await getPublishedPosts(categoryId, 12, posts.length);
```

## 🎯 Summary

1. **Server** fetches limited posts (6 at a time)
2. **Client** displays posts and "Load More" button
3. **On click**, fetches next batch and appends to list
4. **Button hides** when no more posts available

This pattern is used by Instagram, Twitter, Facebook - infinite scroll or "Load More"!

