import React from "react";
import { ImageCard } from "./ImageCard";

type ImagePanelProps = {
  images: string[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  count?: number; // Number of skeleton cards to show when loading
};

export function ImagePanel({
  images = [],
  className = "",
  isLoading = false,
  count = 5, // Default to showing 5 skeleton cards
}: ImagePanelProps) {
  // Render skeleton cards when loading
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(count)
            .fill(0)
            .map((_, index) => (
              <ImageCard key={`skeleton-${index}`} isLoading={true} />
            ))}
        </div>
      </div>
    );
  }

  // If no images and not loading, show skeleton cards
  if (images.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(count)
            .fill(0)
            .map((_, index) => (
              <ImageCard key={`skeleton-${index}`} isLoading={true} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((imageUrl, index) => (
          <ImageCard
            key={`image-${index}`}
            imageUrl={imageUrl}
            title={`Frame ${index + 1}`}
            description={`Captured image ${index + 1}`}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
