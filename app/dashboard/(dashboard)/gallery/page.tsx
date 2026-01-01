import { getAllGalleryImages } from "@/app/actions/dashboard/gallery-actions";
import GalleryClient from "./components/gallery-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GalleryPage() {
  const images = await getAllGalleryImages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Image Gallery</h1>
        <p className="text-muted-foreground">
          Upload and manage images. Select images when creating or editing blog posts.
        </p>
      </div>

      <GalleryClient initialImages={images} />
    </div>
  );
}