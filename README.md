# WheatGuard AI 🌱

Sistema avanzado de diagnóstico agrícola basado en Inteligencia Artificial. WheatGuard está diseñado para la segmentación precisa y el cálculo automático de la severidad de enfermedades foliares en cultivos de trigo, optimizado para operar con imágenes capturadas "in the wild" (entornos de campo real).

---

## 🧠 Modelos de IA Integrados

El motor de inferencia soporta múltiples arquitecturas de segmentación semántica de última generación para adaptarse a diferentes necesidades de precisión y rendimiento:

- **Híbrido (U-Net mit-b3):** Balance ideal entre contexto global y detalles finos.
- **SegFormer (mit-b2):** Arquitectura basada en Transformers optimizada para alta precisión semántica.
- **DINOv2 (Small):** Utiliza características auto-supervisadas de visión para una excelente generalización en entornos complejos.

---

## 🦠 Patologías Detectadas

El sistema es capaz de identificar, segmentar y calcular el porcentaje de área foliar afectada (severidad) por:

1. Roya de la Hoja (*Puccinia triticina*)
2. Roya Amarilla (*Puccinia striiformis*)
3. Mildew / Oidio (*Blumeria graminis*)
4. Septoria (*Septoria tritici*)

---

## 🛠️ Stack Tecnológico

El proyecto está separado en dos servicios principales completamente dockerizados:

### Frontend (`/wheatguard-ai`)
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Nginx (Alpine)

### Backend (`/backend`)
- Python 3.11
- FastAPI
- PyTorch
- HuggingFace Transformers
- OpenCV
- Albumentations

---

# 🚀 Despliegue Rápido con Docker (Recomendado)

La forma más sencilla y segura de ejecutar WheatGuard AI es utilizando Docker.

## Requisitos previos

- Docker y Docker Compose instalados.
- Git LFS (**¡Crítico!**): Los pesos de los modelos (`.pth`) superan los límites estándar de Git y utilizan Large File Storage.

---

## Pasos de instalación

### 1. Clonar el repositorio y descargar los pesos

```bash
git clone <url-de-tu-repositorio>
cd wheatguard-project

# Inicializar y descargar los modelos desde Git LFS
git lfs install
git lfs pull
```

> **Nota:** Si omites `git lfs pull`, Docker fallará al intentar cargar los modelos, ya que solo descargará punteros de texto.

---

### 2. Construir y levantar los contenedores

```bash
docker-compose up --build -d
```

---

### 3. Acceder a la aplicación

- **Interfaz de Usuario:**  
  Abre `http://localhost` en tu navegador.  
  (Nginx se encarga de servir la UI y rutear las peticiones `/api/` internamente).

- **Documentación API (Swagger):**  
  Abre `http://localhost:8000/docs`

---

# 💻 Desarrollo Local (Sin Docker)

Si deseas modificar el código o depurar los modelos directamente en tu máquina (se recomienda una GPU compatible con CUDA, ej. RTX Serie 40):

---

## 1. Configuración del Backend (Python/FastAPI)

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv

# Linux / Mac
source venv/bin/activate

# Windows
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor
python main.py
```

> ⚠️ **Nota sobre HuggingFace:**  
> En el archivo `main.py` están configuradas las variables:
>
> ```python
> TRANSFORMERS_OFFLINE="1"
> HF_HUB_OFFLINE="1"
> ```
>
> Si es la primera vez que ejecutas el proyecto en tu entorno local y no tienes las arquitecturas base cacheadas (ej. `nvidia/mit-b2`), debes comentar o eliminar esas líneas temporalmente para que la librería pueda descargar la estructura.

---

## 2. Configuración del Frontend (React/Vite)

```bash
cd wheatguard-ai

# Instalar dependencias de Node
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Asegúrate de configurar el archivo `.env` o modificar la ruta de la API en el frontend (`App.tsx`) para que apunte a:

```text
http://localhost:8000/api/diagnosticar
```

durante el desarrollo local si no estás usando el proxy de Nginx.

---

# 📊 Arquitectura de Inferencia y Métricas

El flujo de procesamiento de imágenes incluye:

1. **Test Time Augmentation (TTA):**  
   Evaluación de la imagen original, con volteo horizontal y vertical, promediando los logits para mayor robustez.

2. **Refinamiento Morfológico:**  
   Se utiliza OpenCV (Aperturas, análisis de componentes conexos) para eliminar ruido digital y asegurar que las enfermedades solo se marquen dentro del área foliar detectada.

3. **Cálculo de Severidad:**  
   Basado en el mIoU, se calcula la proporción exacta de píxeles enfermos en relación con los píxeles totales de la hoja sana encontrada.

---

# 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
