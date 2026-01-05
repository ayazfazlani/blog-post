"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { revalidatePath, revalidateTag } from "next/cache";
import { getStorageProvider } from "@/lib/storage";

// Get all pages
export async function getPages() {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const pages = await Page.find({})
      .select('title slug published createdAt updatedAt order')
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    return pages.map(page => ({
      id: page._id.toString(),
      title: page.title,
      slug: page.slug,
      published: page.published,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      order: page.order || 0,
    }));
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    throw new Error(`Failed to fetch pages: ${error?.message || 'Unknown error'}`);
  }
}

// Get page by ID
export async function getPageById(id: string) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.findById(id).lean();
    if (!page) return null;
    
    return {
      id: page._id.toString(),
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      excerpt: page.excerpt || null,
      published: page.published || false,
      metaTitle: page.metaTitle || null,
      metaDescription: page.metaDescription || null,
      featuredImage: page.featuredImage || null,
      authorId: page.authorId ? page.authorId.toString() : null,
      order: page.order || 0,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  } catch (error: any) {
    console.error('Error fetching page:', error);
    throw new Error(`Failed to fetch page: ${error?.message || 'Unknown error'}`);
  }
}

// Get page by slug (for public view)
export async function getPageBySlug(slug: string) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.findOne({ slug, published: true })
      .populate('authorId', 'name email')
      .lean();
    
    if (!page) return null;
    
    return {
      id: page._id.toString(),
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      excerpt: page.excerpt || null,
      metaTitle: page.metaTitle || null,
      metaDescription: page.metaDescription || null,
      featuredImage: page.featuredImage || null,
      author: page.authorId ? {
        id: (page.authorId as any)._id.toString(),
        name: (page.authorId as any).name,
        email: (page.authorId as any).email,
      } : null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  } catch (error: any) {
    console.error('Error fetching page by slug:', error);
    return null;
  }
}

// Create page
export async function createPage(data: {
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  authorId?: string;
  order?: number;
}) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.create({
      title: data.title,
      slug: data.slug,
      content: data.content || '',
      excerpt: data.excerpt || null,
      published: data.published || false,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      featuredImage: data.featuredImage || null,
      authorId: data.authorId || null,
      order: data.order || 0,
    });
    
    revalidatePath("/dashboard/pages");
    revalidatePath("/pages");
    revalidateTag("pages");
    revalidateTag("sitemap");
    
    return {
      success: true,
      page: {
        id: page._id.toString(),
        title: page.title,
        slug: page.slug,
      },
    };
  } catch (error: any) {
    console.error('Error creating page:', error);
    if (error.code === 11000) {
      throw new Error('A page with this slug already exists');
    }
    throw new Error(`Failed to create page: ${error?.message || 'Unknown error'}`);
  }
}

// Update page
export async function updatePage(id: string, data: {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  authorId?: string;
  order?: number;
}) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.findById(id);
    if (!page) {
      throw new Error('Page not found');
    }
    
    // Update fields
    if (data.title !== undefined) page.title = data.title;
    if (data.slug !== undefined) page.slug = data.slug;
    if (data.content !== undefined) page.content = data.content;
    if (data.excerpt !== undefined) page.excerpt = data.excerpt;
    if (data.published !== undefined) page.published = data.published;
    if (data.metaTitle !== undefined) page.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) page.metaDescription = data.metaDescription;
    if (data.featuredImage !== undefined) page.featuredImage = data.featuredImage;
    if (data.authorId !== undefined) page.authorId = data.authorId;
    if (data.order !== undefined) page.order = data.order;
    
    await page.save();
    
    revalidatePath("/dashboard/pages");
    revalidatePath(`/pages/${page.slug}`);
    revalidatePath("/pages");
    revalidateTag("pages");
    revalidateTag("sitemap");
    
    return {
      success: true,
      page: {
        id: page._id.toString(),
        title: page.title,
        slug: page.slug,
      },
    };
  } catch (error: any) {
    console.error('Error updating page:', error);
    if (error.code === 11000) {
      throw new Error('A page with this slug already exists');
    }
    throw new Error(`Failed to update page: ${error?.message || 'Unknown error'}`);
  }
}

// Delete page
export async function deletePage(id: string) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.findById(id);
    if (!page) {
      throw new Error('Page not found');
    }
    
    // Delete featured image from storage if exists
    if (page.featuredImage) {
      try {
        const storage = getStorageProvider();
        await storage.delete(page.featuredImage);
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError);
        // Continue with page deletion even if image deletion fails
      }
    }
    
    await Page.findByIdAndDelete(id);
    
    revalidatePath("/dashboard/pages");
    revalidatePath("/pages");
    revalidateTag("pages");
    revalidateTag("sitemap");
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting page:', error);
    throw new Error(`Failed to delete page: ${error?.message || 'Unknown error'}`);
  }
}

// Toggle page published status
export async function togglePagePublished(id: string) {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const page = await Page.findById(id);
    if (!page) {
      throw new Error('Page not found');
    }
    
    page.published = !page.published;
    await page.save();
    
    revalidatePath("/dashboard/pages");
    revalidatePath(`/pages/${page.slug}`);
    revalidatePath("/pages");
    revalidateTag("pages");
    revalidateTag("sitemap");
    
    return {
      success: true,
      published: page.published,
    };
  } catch (error: any) {
    console.error('Error toggling page published status:', error);
    throw new Error(`Failed to toggle page status: ${error?.message || 'Unknown error'}`);
  }
}

// Get published pages (for public sitemap and footer)
export async function getPublishedPages() {
  try {
    await connectToDatabase();
    const Page = (await import("@/models/Page")).default;
    
    const pages = await Page.find({ published: true })
      .select('title slug order')
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    return pages.map(page => ({
      id: page._id.toString(),
      title: page.title,
      slug: page.slug,
      order: page.order || 0,
    }));
  } catch (error: any) {
    console.error('Error fetching published pages:', error);
    return [];
  }
}

