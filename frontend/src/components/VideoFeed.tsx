import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, FilmIcon } from "lucide-react";

export function VideoFeed({
  onFramesCaptured = () => {},
  captureFrames = false,
  framesCount = 5,
  captureInterval = 200, // 200ms intervals = 5 frames in a second
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const capturedFramesRef = useRef([]);

  // Setup camera stream
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1080 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 1 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Function to capture a single frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the frame as a data URL
    return canvas.toDataURL("image/jpeg", 0.95);
  }, []);

  // Effect for capturing multiple frames when triggered
  useEffect(() => {
    if (!captureFrames || isLoading || hasError) return;

    setIsCapturing(true);
    capturedFramesRef.current = [];
    setFramesCaptured(0);

    const captureTimerId = setInterval(() => {
      if (capturedFramesRef.current.length >= framesCount) {
        clearInterval(captureTimerId);
        setIsCapturing(false);
        onFramesCaptured(capturedFramesRef.current);
        return;
      }

      const frame = captureFrame();
      if (frame) {
        capturedFramesRef.current.push(frame);
        setFramesCaptured((prev) => prev + 1);
      }
    }, captureInterval);

    return () => {
      clearInterval(captureTimerId);
    };
  }, [
    captureFrames,
    isLoading,
    hasError,
    captureFrame,
    framesCount,
    captureInterval,
    onFramesCaptured,
  ]);

  return (
    <div className="flex flex-col space-y-3">
      <div className="relative w-[300px] h-[300px] aspect-square rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Skeleton className="absolute inset-0 rounded-xl" />
            <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="text-center p-4">
              <Camera className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Camera access denied or not available
              </p>
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="absolute top-2 right-2 z-10 flex items-center justify-center bg-black bg-opacity-60 rounded-full px-2 py-1">
            <FilmIcon className="w-4 h-4 text-red-500 mr-1 animate-pulse" />
            <span className="text-white text-xs font-bold">
              {framesCaptured}/{framesCount}
            </span>
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            className={`absolute min-w-full min-h-full w-auto h-auto object-cover left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              isLoading ? "invisible" : "visible"
            }`}
            autoPlay
            playsInline
            muted
          />
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" width={1080} height={1080} />
      </div>
    </div>
  );
}
