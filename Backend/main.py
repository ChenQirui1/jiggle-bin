from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import shutil
import os
import datetime
import inference
import uvicorn
#uvicorn main:app --reload

print("backed")
backend_dir =  os.path.dirname(os.path.realpath(__file__))
print(backend_dir)
print("Current directory: {}".format(backend_dir))
print(os.path.join(backend_dir,"Images",datetime.datetime.now().strftime("%y%m%d%H%M%S%f")+".jpeg") )


app = FastAPI()
templates = Jinja2Templates(directory="/")
#app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/",response_class=HTMLResponse)
async def root(request: Request):
    print("root page accessed")
    #return templates.TemplateResponse("index.html", context= {"request": request}) 
    return FileResponse("index.html")

@app.post("/identify/")
async def uploadfile(file: UploadFile):
    print("uploading file")
    print(file.filename)
    file_path = os.path.join(backend_dir,"Images",file.filename)
    print(file_path)
    try:
        file_path = os.path.join(backend_dir,"Images",file.filename)
        print(file_path)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        print({"message": "File saved successfully"})
    except Exception as e:
        return {"message": e.args}
    return inference.inference(file_path,"resnet50v100_final_epoch100_20250302_022500.pth")

""" Multifile upload
@app.post("/identify/")
async def identify_image(files: list[UploadFile]):
    print("uploading files")
    images = {}
    try:
        for file in files:
            file_name = datetime.datetime.now().strftime("%y%m%d%H%M%S%f")+".jpeg"
            file_path = os.path.join(backend_dir,"Images",file_name)
            with open(file_path, "wb") as f:
                f.write(file.file.read())
            images[file_name] = [{"image_path":file_path}]
    except Exception as e:
        return {"message": e.args}
    return images
"""

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5049)