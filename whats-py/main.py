import random
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import HTMLResponse
import pandas as pd
import requests
import uuid
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/files/")
async def create_file(
    file: bytes = File(), fileb: UploadFile = File(), token: str = Form()
):
    return {
        "file_size": len(file),
        "token": token,
        "fileb_content_type": fileb.content_type,
    }


# @app.post("/uploadfiles/")
# async def create_upload_files(files: list[UploadFile]):
#     my_file = pd.read_csv(files)
#     print(my_file)
#     return {"filenames": [file.filename for file in files]}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
        with open(file.filename, 'wb') as f:
            f.write(contents)
        files = pd.read_csv(file.filename)
        for i in files.values:
            print(i[0])
            new_line = '\n'
            new_gato = '#'
            my_uuid = uuid.uuid4()
            my_uuid = str(my_uuid)
            nums = [f"Hola {i[0]} Necesitamos renovar el campo 🌼 \n", '*ElCampoEsPrimero *RedCiudadana\n', 'Digita *1* para obtenr mas información', f'Digita *2* para obtener un correo de contacto {my_uuid[0:7]}'] 
            #mensaje = str("Hola {0}, Necesitamos renovar el campo 🌼 \n#ElCampoEsPrimero #RedCiudadana \nuuid".format(i[0]))
            mensaje = str("Hola {0}, Necesitamos renovar el campo ".format(i[0]))
            # random_number = random.randint(0, 3)
            # TODO: quitar comentario al random_number con la funcion random dependiendo del numero de numeros
            """
            Ejem:
                random_number = random.randint(0, 3) Si se quiere tener 3 numeros
            """
            random_number = 0
            url = f"http://localhost:300{random_number}/sendprueba?message={new_line.join(map(str, nums))}&number=521{i[1]}@c.us"
            print(url)
            # Usar weex o at&t
            #requests.get(url = "http://162.240.210.234:3000/send?message=hola&number=5217771365050@c.us")
            requests.get(url=url)
            # await asyncio.sleep(3)
        # requests.get(url = "http://162.240.210.234:3000/send?message=hola&number=5217771365050@c.us")
    except Exception as e:
        print(e)
        return {"message": "There was an error uploading the file"}
    finally:
        file.file.close()

    # await asyncio.sleep(3)
    return {"message": f"Successfully uploaded {file.filename}"}

@app.get("/")
async def main():
    content = """
<body>
<form action="/upload/" enctype="multipart/form-data" method="post">
<input name="file" type="file" multiple>
<input type="submit">
</form>
<form action="/uploadfiles/" enctype="multipart/form-data" method="post">
<input name="files" type="file" multiple>
<input type="submit">
</form>
</body>
    """
    return HTMLResponse(content=content)