// // lib/api/blog.ts
// import { BlogPost, BlogFormData } from "@/types/blog";

// const API_URL = "/api/blog";

// export const blogApi = {
//   // Get all blogs
//   async getAll(): Promise<BlogPost[]> {
//     const res = await fetch(API_URL);
//     if (!res.ok) throw new Error("Failed to fetch blogs");
//     return res.json();
//   },

//   // Get single blog
//   async getById(id: string): Promise<BlogPost> {
//     const res = await fetch(`${API_URL}/${id}`);
//     if (!res.ok) throw new Error("Failed to fetch blog");
//     return res.json();
//   },

//   // Create blog
//   async create(data: BlogFormData): Promise<BlogPost> {
//     const res = await fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Failed to create blog");
//     return res.json();
//   },

//   // Update blog
//   async update(id: string, data: Partial<BlogFormData>): Promise<BlogPost> {
//     const res = await fetch(`${API_URL}/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Failed to update blog");
//     return res.json();
//   },

//   // Delete blog
//   async delete(id: string): Promise<void> {
//     const res = await fetch(`${API_URL}/${id}`, {
//       method: "DELETE",
//     });
//     if (!res.ok) throw new Error("Failed to delete blog");
//   },
// };