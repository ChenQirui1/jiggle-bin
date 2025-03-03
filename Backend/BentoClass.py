
import sys
import os
AI_folder = os.path.split(os.path.split(__file__)[0])[0]+"\AI"
sys.path.insert(1,AI_folder)
import inference as AI
print(AI.import_test())

import bentoml
from bentoml import api, artifacts, service
from bentoml.artifact import ImageArtifact
from PIL import Image
import io
from fastapi import FastAPI, File, UploadFile
from io import BytesIO

# Define a BentoService
class ImageProcessingService(bentoml.BentoService):
    @api(input=bentoml.io.JSON())
    def predict(self, parsed_json):
        AI.inference()
        return {"message": "This would normally process the input"}

    # Add a function to handle image upload
    @api(input=bentoml.io.Image())
    def process_image(self, image: Image):
        # Example image processing: convert the image to grayscale
        processed_image = image.convert("L")  # Grayscale
        return processed_image

# Create an instance of your service
service = ImageProcessingService()

# Save the service for later use
if __name__ == "__main__":
    service.save()
