from fastapi import FastAPI, File, UploadFile
import io
from PIL import Image
import bentoml
import BentoClass

import sys
import os
project_dir = os.path.split(os.path.split(__file__)[0])[0]
import inference as AI
print(AI.import_test())

import bentoml
from bentoml import api, service
from PIL import Image
import io
from fastapi import FastAPI, File, UploadFile
from io import BytesIO
import datetime

# Define a BentoService
class ImageProcessingService(bentoml.BentoService):
    @api(input==bentoml.io.Image())
    def predict(self, image_path, model_path):
        return AI.inference(image_path,model_path)

    # Add a function to handle image upload
    @api(input=bentoml.io.Image())
    def save_image(self, image: Image):
        # Example image processing: convert the image to grayscale
        image_path = "{}/Images/{}.jpeg".format(project_dir,datetime.datetime.now().strftime("%y%m%d%H%M%S%f"))
        image.save(image_path)
        return image_path
    
service = BentoClass.ImageProcessingService()
service.save()

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

app.run(debug=True, port=3000)