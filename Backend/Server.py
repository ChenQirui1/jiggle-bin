from fastapi import FastAPI, File, UploadFile
import io
from PIL import Image
import bentoml
from bentoml.frameworks.pillow import ImageInput

app = FastAPI()

# Load the BentoML service
bento_service = bentoml.load("ImageProcessingService:latest")

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    # Read the image file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Call the BentoML service to process the image
    result = bento_service.predict(image=image)

    # Return the result
    return {"message": "Image processed successfully", "result": result}