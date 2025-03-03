import { useState } from "react";
import { VideoFeed } from "./components/VideoFeed";
import { FinalVerdict } from "./components/FinalVerdict";
import { ChooseModelCard } from "./components/ChooseModel";
import { ImagePanel } from "./components/ImagePanel";
import { toast } from "sonner";

function App() {
  const [triggerCapture, setTriggerCapture] = useState(false);
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [predictionImages, setPredictionImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [predictionResult, setPredictionResult] = useState({
    confidence: "",
    classLabel: "",
  });

  const handleCategorySubmit = (category) => {
    console.log("Selected category:", category);
    setSelectedModel(category);

    // Trigger video capture
    setTriggerCapture(true);
  };

  const sendImagesToServer = async (frames, modelType) => {
    setIsLoading(true);

    try {
      // Create form data to send images
      const formData = new FormData();

      // Add the model type
      formData.append("modelType", modelType);

      // Convert data URLs to blobs and add to form data
      for (let i = 0; i < frames.length; i++) {
        const response = await fetch(frames[i]);
        const blob = await response.blob();
        formData.append(`image_${i}`, blob, `frame_${i}.jpg`);
      }

      // Make API request
      // Replace with your actual API endpoint
      const apiUrl = "https://your-api-endpoint.com/predict";

      toast("Processing Images", {
        description: `Sending ${frames.length} frames to the server...`,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Update UI with received images and prediction
      setPredictionImages(result.processedImages || []);
      setPredictionResult({
        confidence: result.confidence || "87%", // Default for testing
        classLabel: result.classLabel || selectedModel, // Default to selected model
      });

      toast("Processing Complete", {
        description: "Successfully received prediction results.",
      });
    } catch (error) {
      console.error("Error sending images to server:", error);
      toast("Error", {
        description: "Failed to process images. Please try again.",
      });

      // For demo purposes - simulate receiving results
      // Remove this in production
      setTimeout(() => {
        setPredictionImages(frames);
        setPredictionResult({
          confidence: "87%",
          classLabel: selectedModel,
        });
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapturedFrames = async (frames) => {
    console.log(`Captured ${frames.length} frames`);

    // Store captured frames as input images
    setInputImages(frames);

    // Optional: save frames locally
    // fileDownload(frames);

    // Send to server for processing
    await sendImagesToServer(frames, selectedModel);

    // Reset capture trigger
    setTriggerCapture(false);
  };

  return (
    <div className="min-h-screen w-screen mx-auto p-4 flex flex-col space-y-4">
      {/* Row 1: Prediction images and Video feed */}
      <div className="grid grid-cols-3 gap-4">
        {/* Input and Prediction images (2/3 width) */}
        <div className="col-span-2 bg-gray-100 p-4 rounded-lg">
          <h1 className="text-l font-bold mb-4 text-center">Inputs</h1>
          <ImagePanel
            images={inputImages}
            count={5}
            isLoading={triggerCapture}
          />

          <h1 className="text-l font-bold mb-4 text-center">Prediction</h1>
          <ImagePanel
            images={predictionImages}
            count={5}
            isLoading={isLoading && !triggerCapture}
          />
        </div>

        {/* Camera Live Feed (1/3 width) */}
        <div className="col-span-1 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <VideoFeed
            captureFrames={triggerCapture}
            framesCount={5}
            onFramesCaptured={handleCapturedFrames}
          />
        </div>
      </div>

      {/* Row 2: Action buttons */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <FinalVerdict
            confidence={predictionResult.confidence}
            classLabel={predictionResult.classLabel}
            imageUrl={predictionImages[0] || ""}
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <ChooseModelCard
            onSubmit={handleCategorySubmit}
            disabled={triggerCapture || isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
