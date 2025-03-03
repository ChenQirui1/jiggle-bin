import React from "react";
import { ImageCard, PredictedCard } from "./ImageCard";

type ImagePanelProps = {
  images: string[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  count?: number; // Number of skeleton cards to show when loading
};

type PredictionResult = {
  filename: string;
  confidence: number | string;
  classLabel: number | string;
};

type PredictionPanelProps = {
  images: string[];
  count?: number;
  isLoading?: boolean;
  className?: string;
  predictionResult:
    | {
        results?: PredictionResult[];
      }
    | PredictionResult[];
  individualPredictions?: Array<{
    confidence: string | number;
    classLabel: string | number;
  }>;
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

export function PredictionPanel({
  images = [],
  count = 5,
  isLoading = false,
  className = "",
  predictionResult = [],
}: PredictionPanelProps) {
  // Render skeleton cards when loading
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(count)
            .fill(0)
            .map((_, index) => (
              <PredictedCard key={`skeleton-${index}`} isLoading={true} />
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
              <PredictedCard key={`skeleton-${index}`} isLoading={true} />
            ))}
        </div>
      </div>
    );
  }

  // Handle different API response structures
  const getPredictionResults = () => {
    // If predictionResult is an array, use it directly
    if (Array.isArray(predictionResult)) {
      return predictionResult;
    }

    // If predictionResult has a results property that is an array, use that
    if (
      predictionResult &&
      "results" in predictionResult &&
      Array.isArray(predictionResult.results)
    ) {
      return predictionResult.results;
    }

    // Fallback to empty array if we can't find valid results
    return [];
  };

  const predictionResults = getPredictionResults();

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((imageUrl, index) => {
          // Safely access prediction data
          const prediction = predictionResults[index] || {
            confidence: "N/A",
            classLabel: "Unknown",
          };

          // Pass the values directly to the PredictedCard component
          return (
            <PredictedCard
              key={`prediction-${index}`}
              imageUrl={imageUrl}
              title={`Prediction ${index + 1}`}
              description={`Prediction for frame ${index + 1}`}
              confidence={prediction.confidence}
              modelClass={prediction.classLabel}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}
