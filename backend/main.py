import os
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Importamos los TRES motores de inferencia
from services.inferencia_segformer import procesar as procesar_segformer
from services.inferencia_hibrido import procesar as procesar_hibrido
from services.inferencia_dinov2 import procesar as procesar_dinov2  # NUEVO

app = FastAPI(title="WheatGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/diagnosticar")
async def diagnosticar_imagen(
    file: UploadFile = File(...), 
    modelo_seleccionado: str = Form("segformer") 
):
    # Extraemos los bytes
    image_bytes = await file.read()
    
    # Enrutamos al modelo correcto
    if modelo_seleccionado == "hibrido":
        return procesar_hibrido(image_bytes)
    elif modelo_seleccionado == "dinov2": # Usamos la llave 'dinov2' que viene del Frontend
        return procesar_dinov2(image_bytes)
    else:
        return procesar_segformer(image_bytes)

if __name__ == "__main__":
    print("🚀 Servidor enrutador listo...")
    uvicorn.run(app, host="0.0.0.0", port=8000)