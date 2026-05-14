# WheatGuard AI 🌱

Sistema avanzado de diagnóstico agrícola basado en Inteligencia Artificial. WheatGuard utiliza una arquitectura híbrida U-Net con encoder MiT-B3 para la segmentación precisa y el cálculo automático de la severidad de enfermedades foliares en cultivos de trigo, optimizado para operar con imágenes capturadas "in the wild" (entornos de campo real).

---

## 🧠 Modelo de IA Integrado

El motor de inferencia utiliza una arquitectura híbrida de segmentación semántica de última generación:

- **Híbrido (U-Net mit-b3):** Arquitectura U-Net con encoder MiT-B3 que proporciona un balance ideal entre contexto global y detalles finos, optimizada para la detección precisa de enfermedades foliares en trigo.

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
- Segmentation Models PyTorch
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

> ⚠️ **Nota sobre Dependencias:**  
> El proyecto utiliza `segmentation_models_pytorch` para la arquitectura híbrida U-Net con encoder MiT-B3. Asegúrate de tener instaladas todas las dependencias del archivo `requirements.txt`.

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
   Basado en el mIoU (0.794), se calcula la proporción exacta de píxeles enfermos en relación con los píxeles totales de la hoja sana encontrada.

---

# 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
