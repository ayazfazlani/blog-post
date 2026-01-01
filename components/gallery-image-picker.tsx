"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { Loader2, ImageIcon } from "lucide-react";
import { GalleryImageData } from "@/app/actions/dashboard/gallery-actions";

interface GalleryImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imagePath: string) => void;
  currentImage?: string | null;
}

export function GalleryImagePicker({
  open,
  onOpenChange,
  onSelect,
  currentImage,
}: GalleryImagePickerProps) {
  const [images, setImages] = useState<GalleryImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentImage || null
  );

  useEffect(() => {
    if (open) {
      fetchImages();
      setSelectedImage(currentImage || null);
    }
  }, [open, currentImage]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery");
      const data = await response.json();

      if (data.success) {
        setImages(data.images);
      } else {
        console.error("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (imagePath: string) => {
    setSelectedImage(imagePath);
    onSelect(imagePath);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Image from Gallery</DialogTitle>
          <DialogDescription>
            Choose an image from your gallery or upload a new one.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No images in gallery</p>
            <p className="text-sm text-muted-foreground">
              Go to Gallery page to upload images
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
            {images.map((image) => {
              const isSelected = selectedImage === image.path;
              return (
                <Card
                  key={image.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelect(image.path)}
                >
                  <CardContent className="p-0">
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={image.path}
                        alt={image.originalName}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    </AspectRatio>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {image.originalName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
