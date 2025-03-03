import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Updated prop types to handle both array of results and direct values
type FinalVerdictProps = {
  predictionResult?:
    | {
        results?: Array<{
          confidence: number | string;
          classLabel: number | string;
        }>;
      }
    | Array<{
        confidence: number | string;
        classLabel: number | string;
      }>;
  imageUrl: string | null; // Accept null instead of empty string
};

export function FinalVerdict({
  predictionResult,
  imageUrl,
}: FinalVerdictProps) {
  // Function to safely extract results array from different data structures
  const getResultsArray = () => {
    if (!predictionResult) return [];

    if (Array.isArray(predictionResult)) {
      return predictionResult;
    }

    if (predictionResult.results && Array.isArray(predictionResult.results)) {
      return predictionResult.results;
    }

    return [];
  };

  // Calculate average confidence
  const calculateAverageConfidence = () => {
    const results = getResultsArray();

    if (results.length === 0) return "N/A";

    // Convert all confidence values to numbers
    const confidenceValues = results
      .map((item) => {
        const confValue = item.confidence;
        return typeof confValue === "string"
          ? parseFloat(confValue)
          : confValue;
      })
      .filter((value) => !isNaN(value));

    if (confidenceValues.length === 0) return "N/A";

    // Calculate average
    const sum = confidenceValues.reduce((acc, val) => acc + val, 0);
    const average = sum / confidenceValues.length;

    // Format as percentage if value is less than 1 (assuming it's in 0-1 range)
    if (average < 1) {
      return `${(average * 100).toFixed(2)}%`;
    }

    // If the value is already a percentage (greater than 1), just format it
    return `${average.toFixed(2)}%`;
  };

  // Determine final class label (majority vote or most confident prediction)
  const determineFinalClass = () => {
    const results = getResultsArray();

    if (results.length === 0) return "Unknown";

    // Count occurrences of each class label
    const classCounts = {};
    results.forEach((item) => {
      const classLabel = item.classLabel;
      classCounts[classLabel] = (classCounts[classLabel] || 0) + 1;
    });

    // Find the class with the most occurrences
    let maxCount = 0;
    let finalClass = "Unknown";

    Object.entries(classCounts).forEach(([classLabel, count]) => {
      if (count > maxCount) {
        maxCount = count as number;
        finalClass = classLabel;
      }
    });

    return finalClass;
  };

  // Calculate the values
  const averageConfidence = calculateAverageConfidence();
  const finalClassLabel = determineFinalClass();

  // Determine confidence level for UI styling
  const getConfidenceLevel = () => {
    if (averageConfidence === "N/A") return "unknown";

    const numericConfidence = parseFloat(averageConfidence);
    if (isNaN(numericConfidence)) return "unknown";

    if (numericConfidence >= 80) return "high";
    if (numericConfidence >= 50) return "medium";
    return "low";
  };

  const confidenceLevel = getConfidenceLevel();

  // Map numeric class labels to readable names if needed
  const getReadableClassName = (classLabel) => {
    // You can customize this mapping based on your model's classes
    const classMap = {
      "0": "Non-recyclable",
      "1": "Recyclable",
      // Add more mappings as needed
    };

    return classMap[classLabel] || `Class ${classLabel}`;
  };

  const readableClassName =
    typeof finalClassLabel === "number" || !isNaN(Number(finalClassLabel))
      ? getReadableClassName(finalClassLabel)
      : finalClassLabel;

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center p-4">
        <div className="mr-4 h-16 w-16 overflow-hidden rounded-lg">
          {/* Only render the image if imageUrl exists and is not empty */}
          {imageUrl && imageUrl.trim() !== "" ? (
            <img
              src={imageUrl}
              alt="Prediction"
              className="h-full w-full object-cover"
            />
          ) : (
            // Render a placeholder when no image is available
            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              No image
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Final Verdict</h3>
          <div className="mt-2 flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Avg. Confidence:</span>
              <Badge
                variant="secondary"
                className={`${
                  confidenceLevel === "high"
                    ? "bg-green-100 text-green-800"
                    : confidenceLevel === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : confidenceLevel === "low"
                    ? "bg-red-100 text-red-800"
                    : ""
                }`}
              >
                {averageConfidence}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Final Class:</span>
              <Badge variant="outline">{readableClassName}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
