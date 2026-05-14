import os
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Importamos el motor de inferencia principal
from services.inferencia_hibrido import procesar as procesar_hibrido

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
    modelo_seleccionado: str = Form("hibrido") 
):
    # Extraemos los bytes
    image_bytes = await file.read()
    
    # Usamos siempre el modelo híbrido
    return procesar_hibrido(image_bytes)

if __name__ == "__main__":
    print("🚀 Servidor enrutador listo...")
    uvicorn.run(app, host="0.0.0.0", port=8000)