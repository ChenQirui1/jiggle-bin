from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import cv2
import base64
import asyncio

import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Open camera
    cap = cv2.VideoCapture(0)

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            # Encode frame to JPEG
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])

            # Convert to base64
            frame_base64 = base64.b64encode(buffer).decode("utf-8")

            # Send to client
            await websocket.send_json(
                {"image": f"data:image/jpeg;base64,{frame_base64}"}
            )

            # Control frame rate
            await asyncio.sleep(0.1)  # 10 FPS
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        cap.release()


# Add a simple root endpoint
@app.get("/")
async def root():
    return {"message": "Camera streaming server is running"}


if __name__ == "__main__":
    uvicorn.run(app)
