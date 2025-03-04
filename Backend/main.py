from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import os
import uuid
import base64
import cv2
import numpy as np
from typing import List
import io
from PIL import Image
import shutil

# Import from inference module
from AI.inference import load_model, preprocess_image, predict
from inference import inference

app = FastAPI(title="Image Classification Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
MODEL_PATH = "../AI/weights/resnet50v100_final_epoch100_20250302_022500.pth"  # Update this with your model path
OUTPUT_DIR = "results"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

backend_dir = os.path.dirname(os.path.realpath(__file__))


@app.on_event("startup")
async def startup_event():
    global model
    try:
        model = load_model(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None


@app.get("/")
async def root():
    print("root page accessed")
    return {
        "message": "Image Classification API is running",
        "model_loaded": model is not None,
        "device": str(DEVICE),
    }


# route for image prediction based on inferrence.py
@app.post("/identify/")
async def identify(file: UploadFile):
    print("uploading file")
    print(file.filename)
    file_path = os.path.join(backend_dir, "Images", file.filename)
    print(file_path)
    try:
        file_path = os.path.join(backend_dir, "Images", file.filename)
        print(file_path)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        print({"message": "File saved successfully"})
    except Exception as e:
        return {"message": e.args}
    return inference(file_path, "resnet50v100_final_epoch100_20250302_022500.pth")


async def save_upload_file(upload_file: UploadFile, destination: str):
    """
    Saves an UploadFile to disk ensuring the file content is transferred correctly
    """
    try:
        # Reset file pointer to beginning
        await upload_file.seek(0)

        # Use shutil to efficiently copy the file
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

    finally:
        # Make sure we close the file
        await upload_file.close()

    return destination


@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """
    Endpoint to predict a single uploaded image with debug visualization.
    """
    # if not model:
    #     raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        model = load_model(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
        # Generate unique filenames for debugging
        debug_filename = f"debug_original_{uuid.uuid4()}.jpg"
        debug_file_path = os.path.join(OUTPUT_DIR, debug_filename)

        # Save uploaded file temporarily
        temp_file_path = os.path.join(OUTPUT_DIR, f"temp_{uuid.uuid4()}.jpg")

        # Read file content
        await file.seek(0)
        content = await file.read()

        # Save the raw file for debugging
        with open(debug_file_path, "wb") as f:
            f.write(content)

        print(f"Saved debug image before processing: {debug_file_path}")

        # Save for preprocessing
        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)

        # Log file info
        file_size = os.path.getsize(temp_file_path)
        print(f"Processing file: {file.filename}, size: {file_size} bytes")

        # Also save the image using PIL to verify it opens correctly
        try:
            pil_image = Image.open(io.BytesIO(content))
            pil_debug_path = os.path.join(OUTPUT_DIR, f"pil_debug_{uuid.uuid4()}.jpg")
            pil_image.save(pil_debug_path)
            print(f"PIL can open the image. Saved to: {pil_debug_path}")
            print(f"Image mode: {pil_image.mode}, size: {pil_image.size}")
        except Exception as pil_error:
            print(f"PIL couldn't open the image: {str(pil_error)}")

        # Use the preprocess_image function from inference.py
        try:
            image_tensor, original_image = preprocess_image(temp_file_path)
            print(f"Successfully preprocessed image: {temp_file_path}")

            # Save the preprocessed image for debugging
            preprocess_debug_path = os.path.join(
                OUTPUT_DIR, f"preprocessed_{uuid.uuid4()}.jpg"
            )
            original_image.save(preprocess_debug_path)
            print(f"Saved preprocessed image to: {preprocess_debug_path}")
        except Exception as preprocess_error:
            print(f"Error in preprocessing: {str(preprocess_error)}")
            raise preprocess_error

        # Use the predict function from inference.py
        prediction, probability = predict(model, image_tensor, DEVICE)

        print(
            f"Prediction result: class={int(prediction)}, confidence={float(probability)}"
        )

        # Save visualization with prediction
        result_filename = f"result_{uuid.uuid4()}.jpg"
        result_path = os.path.join(OUTPUT_DIR, result_filename)

        # Convert PIL image to numpy for OpenCV
        img_np = np.array(original_image)
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # Add prediction text to image
        class_name = "1" if prediction == 1 else "0"
        cv2.putText(
            img_np,
            f"Predicted: Class {class_name} ({probability:.2f})",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

        # Save result image
        cv2.imwrite(result_path, img_np)

        # # Clean up temp file
        # if os.path.exists(temp_file_path):
        #     os.remove(temp_file_path)

        return {
            "filename": file.filename,
            "classLabel": int(prediction),
            "confidence": float(probability),
            "result_image": f"/results/{result_filename}",
            "debug_original_image": f"/results/{os.path.basename(debug_file_path)}",
            "debug_preprocessed_image": f"/results/{os.path.basename(preprocess_debug_path)}",
        }

    except Exception as e:
        print(f"Error in predict_image: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/batch-predict")
async def batch_predict(
    files: List[UploadFile] = File(...), modelType: str = Form("default")
):
    """
    Endpoint to predict multiple uploaded images.
    """
    # if not model:
    #     raise HTTPException(status_code=500, detail="Model not loaded")

    results = []

    print(f"Received {len(files)} files for batch prediction, model type: {modelType}")

    for file in files:
        try:
            model = load_model(MODEL_PATH)
            print(f"Model loaded successfully from {MODEL_PATH}")
            # Generate a unique filename with the original extension
            original_extension = (
                os.path.splitext(file.filename)[1] or ".jpg"
            )  # Default to .jpg if no extension
            temp_file_path = os.path.join(
                OUTPUT_DIR, f"temp_{uuid.uuid4()}{original_extension}"
            )

            # Save uploaded file using our helper function
            await save_upload_file(file, temp_file_path)

            # Print file info for debugging
            file_size = os.path.getsize(temp_file_path)
            print(f"Saved file {temp_file_path} with size {file_size} bytes")

            # Use the preprocess_image function directly from inference.py
            image_tensor, _ = preprocess_image(temp_file_path)

            # Use the predict function directly from inference.py
            prediction, probability = predict(model, image_tensor, DEVICE)

            print(
                f"Prediction for {file.filename}: class={int(prediction)}, confidence={float(probability)}"
            )

            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

            # Add to results
            results.append(
                {
                    "filename": file.filename,
                    "classLabel": int(prediction),
                    "confidence": float(probability),
                }
            )

        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")
            results.append(
                {
                    "filename": file.filename,
                    "error": str(e),
                    "classLabel": 0,  # Default fallback value
                    "confidence": 0.0,  # Default fallback value
                }
            )

    # Return the results in the expected format
    return {"results": results}


@app.get("/results/{filename}")
async def get_result(filename: str):
    """
    Endpoint to retrieve a result image.
    """
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result image not found")

    return FileResponse(file_path)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time camera stream processing.
    """
    await websocket.accept()

    if not model:
        await websocket.send_json({"error": "Model not loaded"})
        await websocket.close()
        return

    try:
        while True:
            # Receive base64 encoded image from client
            data = await websocket.receive_json()

            if "image" not in data:
                await websocket.send_json({"error": "No image data received"})
                continue

            # Decode the base64 image
            try:
                img_data = (
                    data["image"].split(",")[1]
                    if "," in data["image"]
                    else data["image"]
                )
                img_bytes = base64.b64decode(img_data)

                # Save image temporarily with proper extension
                temp_path = os.path.join(OUTPUT_DIR, f"stream_{uuid.uuid4()}.jpg")
                with open(temp_path, "wb") as f:
                    f.write(img_bytes)

                # Print file info for debugging
                file_size = os.path.getsize(temp_path)
                print(f"Saved WebSocket image {temp_path} with size {file_size} bytes")

                # Use the preprocess_image and predict functions directly
                image_tensor, _ = preprocess_image(temp_path)
                prediction, probability = predict(model, image_tensor, DEVICE)

                print(
                    f"WebSocket prediction: class={int(prediction)}, confidence={float(probability)}"
                )

                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)

                # Send result back to client
                await websocket.send_json(
                    {
                        "prediction": int(prediction),
                        "probability": float(probability),
                        "class": "1" if prediction == 1 else "0",
                    }
                )

            except Exception as e:
                print(f"WebSocket processing error: {str(e)}")
                await websocket.send_json({"error": f"Processing error: {str(e)}"})

    except Exception as e:
        print(f"WebSocket error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
