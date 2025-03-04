import { useState, useEffect, useRef } from "react";
import { FinalVerdict } from "./components/FinalVerdict";
import { ChooseModelCard } from "./components/ChooseModel";
import { ImagePanel, PredictionPanel } from "./components/ImagePanel";
import { toast } from "sonner";
import { VideoFeed } from "./components/VideoFeed";

function App() {
  const [triggerCapture, setTriggerCapture] = useState(false);
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [predictionImages, setPredictionImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [predictionResult, setPredictionResult] = useState([
    {
      filename: "frame_0.jpg",
      confidence: "87%",
      classLabel: "Unknown",
    },
  ]);
  const [individualPredictions, setIndividualPredictions] = useState<
    Array<{
      confidence: string;
      classLabel: string;
    }>
  >([]);

  // Use this ref to prevent multiple calls to handleCapturedFrames
  const processingFrames = useRef(false);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log("Input images updated:", inputImages.length);
  }, [inputImages]);

  useEffect(() => {
    console.log("Trigger capture:", triggerCapture);
  }, [triggerCapture]);

  useEffect(() => {
    console.log("Prediction results updated:", predictionResult.length);
  }, [predictionResult]);

  const handleCategorySubmit = (category) => {
    console.log("Selected category:", category);
    setSelectedModel(category);

    // Reset images when starting a new capture
    setInputImages([]);
    setPredictionImages([]);
    setIndividualPredictions([]);

    // Trigger video capture
    setTriggerCapture(true);
  };

  const sendImagesToServer = async (frames, modelType) => {
    console.log("Sending frames to server:", frames.length);
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
        formData.append(`files`, blob, `frame_${i}.jpg`);
      }

      // Make API request
      const apiUrl = "http://localhost:8000/batch-predict";

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

      const data = await response.json();
      console.log("Received prediction results:", data);

      // Fix for array length mismatch - ensure we have a prediction result for each image
      // If data is an array, use it directly, otherwise wrap it in an array
      const processedData = Array.isArray(data) ? data : [data];

      // If we have fewer prediction results than images, duplicate the last one
      // to ensure we have a prediction for each image
      const expandedResults = data.results;
      // while (expandedResults.length < frames.length) {
      //   // If we have at least one result, duplicate the last one
      //   if (expandedResults.length > 0) {
      //     expandedResults.push({
      //       ...expandedResults[expandedResults.length - 1],
      //     });
      //   } else {
      //     // If we have no results, use a default one
      //     expandedResults.push({
      //       filename: `frame_${expandedResults.length}.jpg`,
      //       confidence: "N/A",
      //       classLabel: "No prediction available",
      //     });
      //   }
      // }

      setPredictionResult(expandedResults);
      setPredictionImages(frames);

      toast("Processing Complete", {
        description: "Successfully received prediction results.",
      });
    } catch (error) {
      console.error("Error sending images to server:", error);
      toast("Error", {
        description: "Failed to process images. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapturedFrames = async (frames) => {
    // Prevent multiple calls
    if (processingFrames.current) {
      console.log("Already processing frames, ignoring this call");
      return;
    }

    processingFrames.current = true;

    try {
      console.log(`Captured ${frames?.length} frames`);

      // Reset the capture trigger immediately to prevent re-triggering
      setTriggerCapture(false);

      if (!frames || frames.length === 0) {
        console.error("No frames captured");
        toast.error("No frames captured. Please try again.");
        return;
      }

      // Store captured frames as input images
      setInputImages([...frames]);

      // Then send to server for processing
      await sendImagesToServer(frames, selectedModel);
    } catch (error) {
      console.error("Error in handleCapturedFrames:", error);
    } finally {
      processingFrames.current = false;
    }
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
            isLoading={triggerCapture && inputImages.length === 0}
          />

          <h1 className="text-l font-bold mb-4 text-center mt-8">Prediction</h1>
          <PredictionPanel
            images={predictionImages}
            count={5}
            isLoading={
              isLoading || (triggerCapture && predictionImages.length === 0)
            }
            predictionResult={predictionResult}
          />
        </div>

        {/* Camera Live Feed (1/3 width) */}
        <div className="col-span-1 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <VideoFeed
            captureFrames={triggerCapture}
            framesCount={5}
            onFramesCaptured={handleCapturedFrames}
          />
          {/* <RemoteCameraFeed
            captureFrames={triggerCapture}
            framesCount={5}
            onFramesCaptured={handleCapturedFrames}
          /> */}
          {/* <CameraStream /> */}
        </div>
      </div>

      {/* Row 2: Action buttons */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          {/* <FinalVerdict
            imageUrl={predictionImages.length > 0 ? predictionImages[0] : null}
          /> */}
          <FinalVerdict
            predictionResult={predictionResult}
            imageUrl={predictionImages.length > 0 ? predictionImages[0] : null}
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <ChooseModelCard
            onSubmit={handleCategorySubmit}
            disabled={triggerCapture || isLoading || processingFrames.current}
          />
        </div>
      </div>

      {/* Debug information */}
      <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-2 text-xs opacity-70">
        Input Images: {inputImages.length} | Prediction Images:{" "}
        {predictionImages.length} | Prediction Results:{" "}
        {predictionResult.length} | Trigger: {triggerCapture ? "true" : "false"}{" "}
        | Loading: {isLoading ? "true" : "false"} | Processing:{" "}
        {processingFrames.current ? "true" : "false"}
      </div>
    </div>
  );
}

export default App;
