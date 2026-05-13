import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import io
import base64
import cv2
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
from transformers import AutoModel

# ==========================================
# 1. DEFINICIÓN DE LA ARQUITECTURA DINOv2
# ==========================================
class Dinov2MultiLabelSegmenter(nn.Module):
    def __init__(self, num_clases=5, backbone_name="facebook/dinov2-small"):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(backbone_name)
        hidden_dim = self.backbone.config.hidden_size
        
        self.decodificador = nn.Sequential(
            nn.Conv2d(hidden_dim, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, num_clases, kernel_size=1)
        )

    def forward(self, pixel_values):
        outputs = self.backbone(pixel_values=pixel_values)
        patch_tokens = outputs.last_hidden_state[:, 1:, :] 
        
        B, N, C = patch_tokens.shape
        h_grid = int(N**0.5) 
        w_grid = h_grid
        
        feature_map = patch_tokens.transpose(1, 2).reshape(B, C, h_grid, w_grid)
        logits = self.decodificador(feature_map)
        
        return logits

# ==========================================
# 2. INICIALIZACIÓN
# ==========================================
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🚀 Cargando DINOv2 (672x672) con Refinamiento, TTA y Severidad en {device}...")

modelo = Dinov2MultiLabelSegmenter(num_clases=5, backbone_name="facebook/dinov2-small").to(device)
modelo.load_state_dict(torch.load('weights/mejor_modelo_dinov2.pth', map_location=device))
modelo.eval()

transformacion = A.Compose([A.Resize(height=672, width=672), ToTensorV2()])

# ==========================================
# 3. LÓGICA DE REFINAMIENTO (Adaptada a DINOv2)
# ==========================================
def refinar_mascaras(probs_np):
    # Umbrales basados en mIoU 73.29%
    # Hoja: 0.50
    # Mildew y Roya Hoja (Recall > 95%): 0.65 para cortar la "grasa"
    # Septoria y Roya Amarilla (Recall ~86-90%): 0.55 y 0.60 para no borrar manchas reales
    umbrales = [0.50, 0.65, 0.55, 0.65, 0.60]
    n_clases = probs_np.shape[0]
    
    mascaras_binarias = []
    for i in range(n_clases):
        mask = (probs_np[i] > umbrales[i]).astype(np.uint8)
        mascaras_binarias.append(mask)

    m_hoja = mascaras_binarias[0]
    for i in range(1, n_clases):
        mascaras_binarias[i] = cv2.bitwise_and(mascaras_binarias[i], m_hoja)

    # DINOv2 genera predicciones en "bloques" por los patches.
    # Usamos un kernel ligeramente más grande (5x5) para suavizar bordes cuadrados
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    area_minima = 150 
    
    resultados_finales = []
    for i in range(n_clases):
        temp_mask = cv2.morphologyEx(mascaras_binarias[i], cv2.MORPH_OPEN, kernel)
        
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(temp_mask, connectivity=8)
        mask_limpia = np.zeros_like(temp_mask)
        
        for j in range(1, num_labels):
            if stats[j, cv2.CC_STAT_AREA] >= area_minima:
                mask_limpia[labels == j] = 1
        resultados_finales.append(mask_limpia)
        
    return resultados_finales

# ==========================================
# 4. FUNCIÓN PRINCIPAL DE INFERENCIA
# ==========================================
def procesar(image_bytes: bytes) -> dict:
    image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image_pil)
    h_orig, w_orig = image_np.shape[:2]

    img_tensor = transformacion(image=image_np)['image'].float() / 255.0
    img_tensor = img_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        # --- TEST TIME AUGMENTATION (TTA) ---
        l1 = modelo(pixel_values=img_tensor)
        
        img_hflip = torch.flip(img_tensor, dims=[3])
        l2_out = modelo(pixel_values=img_hflip)
        l2 = torch.flip(l2_out, dims=[3])
        
        img_vflip = torch.flip(img_tensor, dims=[2])
        l3_out = modelo(pixel_values=img_vflip)
        l3 = torch.flip(l3_out, dims=[2])
        
        logits_promedio = (l1 + l2 + l3) / 3.0
        
        logits = F.interpolate(logits_promedio, size=(h_orig, w_orig), mode="bilinear", align_corners=False)
        probs = torch.sigmoid(logits[0])
        probs_np = probs.cpu().numpy()

    # --- PIPELINE DE REFINAMIENTO ---
    m_finales = refinar_mascaras(probs_np)
    m_hoja, m_mildew, m_sep, m_rh, m_ra = m_finales

    # --- CÁLCULO DE SEVERIDAD ---
    pixeles_hoja_total = np.sum(m_hoja == 1)
    patologias = []
    severidad_global = 0.0

    if pixeles_hoja_total > 0:
        sev_mildew = (np.sum(m_mildew == 1) / pixeles_hoja_total) * 100
        sev_sep    = (np.sum(m_sep == 1) / pixeles_hoja_total) * 100
        sev_rh     = (np.sum(m_rh == 1) / pixeles_hoja_total) * 100
        sev_ra     = (np.sum(m_ra == 1) / pixeles_hoja_total) * 100

        m_cualquier_enfermedad = m_mildew | m_sep | m_rh | m_ra
        severidad_global = (np.sum(m_cualquier_enfermedad == 1) / pixeles_hoja_total) * 100

        if sev_ra > 0: patologias.append({"name": "Roya Amarilla", "severity_pct": round(sev_ra, 2), "confidence": float(probs_np[4][m_ra == 1].mean())})
        if sev_rh > 0: patologias.append({"name": "Roya de la Hoja", "severity_pct": round(sev_rh, 2), "confidence": float(probs_np[3][m_rh == 1].mean())})
        if sev_sep > 0: patologias.append({"name": "Septoria", "severity_pct": round(sev_sep, 2), "confidence": float(probs_np[2][m_sep == 1].mean())})
        if sev_mildew > 0: patologias.append({"name": "Mildew", "severity_pct": round(sev_mildew, 2), "confidence": float(probs_np[1][m_mildew == 1].mean())})

    if not patologias:
        patologias.append({"name": "Hoja Sana", "severity_pct": 0.0, "confidence": float(probs_np[0].max())})

    # --- GENERACIÓN DE IMAGEN VISUAL ---
    mask_visual = np.zeros((h_orig, w_orig, 4), dtype=np.uint8)
    
    # Pintamos las patologías
    mask_visual[m_mildew == 1] = [245, 0, 255, 255] 
    mask_visual[m_sep == 1]    = [0, 215, 255, 255] 
    mask_visual[m_rh == 1]     = [215, 0, 0, 255]   
    mask_visual[m_ra == 1]     = [255, 255, 0, 255] 

    mask_pil = Image.fromarray(mask_visual, 'RGBA')
    buffered = io.BytesIO()
    mask_pil.save(buffered, format="PNG")
    mask_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return {
        "pathologies": patologias,
        "overall_severity_pct": round(severidad_global, 2),
        "miou": 0.733, 
        "maskUrl": f"data:image/png;base64,{mask_base64}",
        "modeloUsado": "deeplab" # Se mantiene tu llave para compatibilidad del Frontend
    }