
import sys
import os
project_dir = os.path.split(os.path.split(__file__)[0])[0]
import inference as AI

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

# Create an instance of your service
service = ImageProcessingService()

# Save the service for later use
if __name__ == "__main__":
    service.save()
