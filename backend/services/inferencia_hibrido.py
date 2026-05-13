import torch
import torch.nn.functional as F
import numpy as np
import cv2
import io
import base64
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
import segmentation_models_pytorch as smp

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🚀 Cargando Híbrido U-Net mit_b3 con Refinamiento en {device}...")

# Inicialización del modelo
modelo = smp.Unet(encoder_name="mit_b3", encoder_weights=None, in_channels=3, classes=5).to(device)
modelo.load_state_dict(torch.load('weights/mejor_modelo_roya_hibrido.pth', map_location=device))
modelo.eval()

transformacion = A.Compose([A.Resize(height=640, width=640), ToTensorV2()])

def refinar_mascaras(probs_np):
    """
    Aplica: Umbrales Dinámicos, Filtrado Lógico, Morfología y Área Mínima.
    probs_np: array de forma (5, H, W)
    """
    # 1. Configuración de Umbrales (Basado en el análisis de la Época 83)
    # [Hoja, Mildew, Septoria, Roya_Hoja, Roya_Amarilla]
    umbrales = [0.50, 0.25, 0.40, 0.60, 0.68]
    n_clases = probs_np.shape[0]
    
    mascaras_binarias = []
    for i in range(n_clases):
        mask = (probs_np[i] > umbrales[i]).astype(np.uint8)
        mascaras_binarias.append(mask)

    # 2. Filtrado Lógico (Ancla: Hoja)
    # Si no es tejido de hoja, no puede ser enfermedad.
    m_hoja = mascaras_binarias[0]
    for i in range(1, n_clases):
        mascaras_binarias[i] = cv2.bitwise_and(mascaras_binarias[i], m_hoja)

    # 3. Limpieza Morfológica y de Área
    kernel = np.ones((3, 3), np.uint8)
    area_minima = 150 # Elimina falsos positivos aislados
    
    resultados_finales = []
    for i in range(n_clases):
        # Apertura para eliminar "polvo digital"
        temp_mask = cv2.morphologyEx(mascaras_binarias[i], cv2.MORPH_OPEN, kernel)
        
        # Filtrado por componentes conexos (Área)
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(temp_mask, connectivity=8)
        mask_limpia = np.zeros_like(temp_mask)
        
        for j in range(1, num_labels):
            if stats[j, cv2.CC_STAT_AREA] >= area_minima:
                mask_limpia[labels == j] = 1
        resultados_finales.append(mask_limpia)
        
    return resultados_finales

# ... (todo el código superior se mantiene igual: imports, modelo, refinar_mascaras) ...

def procesar(image_bytes: bytes) -> dict:
    image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image_pil)
    h_orig, w_orig = image_np.shape[:2]

    img_tensor = transformacion(image=image_np)['image'].float() / 255.0
    img_tensor = img_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        # TTA y redimensionado
        l1 = modelo(img_tensor)
        l2 = torch.flip(modelo(torch.flip(img_tensor, dims=[3])), dims=[3])
        l3 = torch.flip(modelo(torch.flip(img_tensor, dims=[2])), dims=[2])
        logits_promedio = (l1 + l2 + l3) / 3.0
        
        logits = F.interpolate(logits_promedio, size=(h_orig, w_orig), mode="bilinear", align_corners=False)
        probs = torch.sigmoid(logits[0])
        probs_np = probs.cpu().numpy()

    # Refinamiento de máscaras
    m_finales = refinar_mascaras(probs_np)
    m_hoja, m_mildew, m_sep, m_rh, m_ra = m_finales

    # Generación de la máscara visual (RGBA)
    mask_visual = np.zeros((h_orig, w_orig, 4), dtype=np.uint8)
    mask_visual[m_mildew == 1] = [245, 0, 255, 255] # Rosa
    mask_visual[m_sep == 1]    = [0, 215, 255, 255] # Celeste
    mask_visual[m_rh == 1]     = [215, 0, 0, 255]   # Rojo
    mask_visual[m_ra == 1]     = [255, 255, 0, 255] # Amarillo

    mask_pil = Image.fromarray(mask_visual, 'RGBA')
    buffered = io.BytesIO()
    mask_pil.save(buffered, format="PNG")
    mask_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    # ==========================================
    # CÁLCULO DE SEVERIDAD (REGLA DE TRES)
    # ==========================================
    patologias = []
    nombres = ["Hoja Sana", "Mildew", "Septoria", "Roya de la Hoja", "Roya Amarilla"]
    
    # 1. Calcular el 100% (Área total de la hoja detectada)
    area_hoja = m_hoja.sum()
    overall_severity_pct = 0.0

    # Solo hacemos cálculos si realmente detectamos una hoja en la foto
    if area_hoja > 0:
        # 2. Severidad Global (Unión de todas las enfermedades usando OR)
        # Esto asegura que si Mildew y Septoria comparten un píxel, se cuente 1 sola vez.
        m_todas_enfermedades = m_mildew | m_sep | m_rh | m_ra
        area_enferma_total = m_todas_enfermedades.sum()
        overall_severity_pct = round(float((area_enferma_total / area_hoja) * 100), 2)

        # 3. Severidad por Patología
        for i in range(1, 5):
            area_enf = m_finales[i].sum()
            if area_enf > 0:
                sev_pct = round(float((area_enf / area_hoja) * 100), 2)
                conf = round(float(probs_np[i][m_finales[i] == 1].mean()), 4)
                
                patologias.append({
                    "name": nombres[i], 
                    "severity_pct": sev_pct,
                    "confidence": conf
                })
                
    # 4. Caso "Hoja Sana" o "Foto sin hoja"
    if not patologias:
        # Si hay hoja pero no hay enfermedad, sacamos la confianza de la hoja.
        conf_hoja = round(float(probs_np[0][m_hoja == 1].mean()), 4) if area_hoja > 0 else 0.0
        patologias.append({
            "name": "Hoja Sana", 
            "severity_pct": 0.0,
            "confidence": conf_hoja
        })

    return {
        "pathologies": patologias,
        "overall_severity_pct": overall_severity_pct,
        "miou": 0.764, 
        "maskUrl": f"data:image/png;base64,{mask_base64}",
        "modeloUsado": "hibrido_mit_b3_refined"
    }