# WheatGuard Project

Este proyecto consta de un backend en Python (FastAPI) y un frontend en React (Vite).

## Dockerización

Para ejecutar el proyecto usando Docker:

1. Asegúrate de tener Docker y Docker Compose instalados.

2. Construye y ejecuta los contenedores:
   ```bash
   docker-compose up --build
   ```

3. El frontend estará disponible en `http://localhost` y el backend en `http://localhost:8000`.

## Desarrollo Local

### Backend
- Instala las dependencias: `pip install -r backend/requirements.txt`
- Ejecuta: `python backend/main.py`

### Frontend
- Instala las dependencias: `npm install` en `wheatguard-ai/`
- Ejecuta: `npm run dev` en `wheatguard-ai/`