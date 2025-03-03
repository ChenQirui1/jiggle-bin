import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageCard({ imageUrl, title, subtitle, loadDelay = 0 }) {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Simulate or handle actual image loading
  useEffect(() => {
    // This simulates image loading with optional delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [loadDelay]);

  // Handle actual image load event
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Image container with skeleton */}
      <div className="relative w-[100px] aspect-square">
        {/* Skeleton overlay - shown while loading or image not loaded */}
        {(loading || !imageLoaded) && (
          <Skeleton className="absolute inset-0 rounded-xl z-10" />
        )}

        {/* Actual image - hidden until loaded */}
        {!loading && (
          <img
            src={imageUrl}
            alt={title || "Image"}
            className={`absolute inset-0 w-full h-full object-cover rounded-xl ${
              imageLoaded ? "z-20" : "opacity-0"
            }`}
            onLoad={handleImageLoad}
          />
        )}
      </div>

      {/* Text content */}
      <div className="space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
          </>
        ) : (
          <>
            <p className="text-sm font-medium line-clamp-1">{title}</p>
            <p className="text-xs text-gray-500 line-clamp-1">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

// Original SkeletonCard as fallback
export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="relative w-[100px] aspect-square">
        <Skeleton className="absolute inset-0 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  );
}
