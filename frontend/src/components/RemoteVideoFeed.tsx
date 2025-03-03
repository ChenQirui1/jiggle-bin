import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, FilmIcon, RefreshCcw, AlertCircle } from "lucide-react";

type RemoteCameraFeedProps = {
  streamUrl?: string | null;
  onFramesCaptured?: (frames: string[]) => void;
  captureFrames?: boolean;
  framesCount?: number;
  captureInterval?: number;
};

export function RemoteCameraFeed({
  streamUrl = "http://192.168.50.120:8000/",
  onFramesCaptured = () => {},
  captureFrames = false,
  framesCount = 5,
  captureInterval = 200, // 200ms intervals = 5 frames in a second
}: RemoteCameraFeedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);

  // Add a capture session ID to track different capture requests
  const [captureSessionId, setCaptureSessionId] = useState(0);
  const prevCaptureFramesRef = useRef(captureFrames);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturedFramesRef = useRef<string[]>([]);
  const checkConnectionIntervalRef = useRef<number | null>(null);

  // Detect changes in captureFrames prop
  useEffect(() => {
    // If captureFrames changed from false to true, start a new capture session
    if (captureFrames && !prevCaptureFramesRef.current) {
      setCaptureSessionId((prevId) => prevId + 1);
      setFramesCaptured(0);
      capturedFramesRef.current = [];
    }

    prevCaptureFramesRef.current = captureFrames;
  }, [captureFrames]);

  // Setup connection to remote stream
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    // For MJPEG streams, we can use an img tag
    if (imgRef.current) {
      imgRef.current.onload = () => {
        setIsLoading(false);
      };

      imgRef.current.onerror = () => {
        setHasError(true);
        setErrorMessage("Could not connect to camera stream");
        setIsLoading(false);
      };

      // Add a unique timestamp to bypass caching
      imgRef.current.src = `${streamUrl}?t=${new Date().getTime()}`;
    }

    // Set up a periodic check to ensure connection is maintained
    checkConnectionIntervalRef.current = window.setInterval(() => {
      if (imgRef.current) {
        // Refresh the stream connection with a new timestamp
        imgRef.current.src = `${streamUrl}?t=${new Date().getTime()}`;
      }
    }, 30000); // Check every 30 seconds

    return () => {
      // Clear interval on cleanup
      if (checkConnectionIntervalRef.current !== null) {
        clearInterval(checkConnectionIntervalRef.current);
      }
    };
  }, [streamUrl]);

  // Function to capture a single frame from the stream
  const captureFrame = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return null;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return null;

    // Set canvas dimensions to match image dimensions
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;

    // Draw the current image onto the canvas
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the frame as a data URL
    return canvas.toDataURL("image/jpeg", 0.95);
  }, []);

  // Effect for capturing multiple frames when triggered
  useEffect(() => {
    // Only start capturing if captureFrames is true and we're not already capturing
    if (!captureFrames || isLoading || hasError || isCapturing) return;

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
    isCapturing,
    captureFrame,
    framesCount,
    captureInterval,
    onFramesCaptured,
    captureSessionId,
  ]);

  // Function to retry connection
  const handleRetryConnection = () => {
    setIsLoading(true);
    setHasError(false);
    if (imgRef.current) {
      imgRef.current.src = `${streamUrl}?t=${new Date().getTime()}`;
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="relative w-[300px] h-[300px] aspect-square rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <Skeleton className="absolute inset-0 rounded-xl" />
            <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl z-10">
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {errorMessage || "Camera stream unavailable"}
              </p>
              <button
                onClick={handleRetryConnection}
                className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center mx-auto"
              >
                <RefreshCcw className="w-3 h-3 mr-1" /> Retry
              </button>
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

        {/* MJPEG stream display */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            ref={imgRef}
            className={`absolute min-w-full min-h-full w-auto h-auto object-cover left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              isLoading || hasError ? "invisible" : "visible"
            }`}
            alt="Camera Feed"
          />
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
      </div>
    </div>
  );
}
