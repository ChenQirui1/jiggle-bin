import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type ImageCardProps = React.ComponentProps<typeof Card> & {
  imageUrl?: string;
  title?: string;
  description?: string;
  onSelect?: () => void;
  index?: number;
  isLoading?: boolean;
};

type PredictedCardProps = ImageCardProps & {
  confidence?: string;
  modelClass?: string;
};

export function ImageCard({
  className,
  imageUrl,
  title = "Image",
  description = "Captured frame",
  onSelect,
  index,
  isLoading = false,
  ...props
}: ImageCardProps) {
  // Show skeleton if explicitly loading or if no image URL is provided
  const shouldShowSkeleton = isLoading || !imageUrl;
  return (
    <Card className={cn("w-full overflow-hidden p-0", className)} {...props}>
      <div className="aspect-square w-full">
        {shouldShowSkeleton ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </Card>
  );
}

export function PredictedCard({
  className,
  imageUrl,
  title = "Image",
  description = "Captured frame",
  onSelect,
  index,
  isLoading = false,
  confidence,
  modelClass,
  ...props
}: PredictedCardProps) {
  // Show skeleton if explicitly loading or if no image URL is provided
  const shouldShowSkeleton = isLoading || !imageUrl;

  return (
    <Card
      className={cn("w-full overflow-hidden p-0 relative", className)}
      {...props}
    >
      <div className="aspect-square w-full">
        {shouldShowSkeleton ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : (
          <>
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />

            {/* Overlay for confidence and class */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 flex flex-col">
              {confidence && (
                <div className="flex justify-between items-center">
                  <span className="text-white text-xs">Confidence:</span>
                  <Badge variant="secondary" className="ml-2">
                    {confidence}
                  </Badge>
                </div>
              )}

              {modelClass && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white text-xs">Class:</span>
                  <Badge variant="outline" className="ml-2 text-white">
                    {modelClass}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
