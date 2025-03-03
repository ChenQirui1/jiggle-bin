import { useState, useEffect, useRef } from "react";

export function CameraStream() {
  const [imageUrl, setImageUrl] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = new WebSocket("ws://localhost:8000/ws");

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setImageUrl(data.image);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Clean up
    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="camera-stream">
      {imageUrl ? (
        <img src={imageUrl} alt="Camera Stream" />
      ) : (
        <div>Loading camera stream...</div>
      )}
    </div>
  );
}

export default CameraStream;
