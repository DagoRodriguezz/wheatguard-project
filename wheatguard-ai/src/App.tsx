import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight, Leaf, ChevronLeft } from 'lucide-react';
import UploadBox from './components/UploadBox';
import Results from './components/Results';
import LandingPage from './components/LandingPage';

interface DiagnosisResult {
  pathologies: { name: string; severity_pct: number; confidence: number }[];
  overall_severity_pct: number;
  miou: number;
  maskUrl: string;
  modeloUsado?: string;
}

type View = 'landing' | 'diagnostic';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  
  // NUEVO: Estado para el selector de modelos
  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>('segformer');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ACTUALIZADO: Conexión real con el backend en Python
  const procesarImagen = async (file: File): Promise<DiagnosisResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modelo_seleccionado", modeloSeleccionado); 

    const response = await fetch("http://localhost:8000/api/diagnosticar", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  const handleDiagnose = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await procesarImagen(file);
      setResult(data);
    } catch (error) {
      console.error("Error en el diagnóstico:", error);
      alert("Hubo un error al conectar con el servidor de IA. Asegúrate de que backend/main.py esté corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  const goToDiagnostic = () => {
    setView('diagnostic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToLanding = () => {
    setView('landing');
    handleReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'landing') {
    return <LandingPage onStart={goToDiagnostic} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f8fafc]">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={goToLanding}
        className="fixed top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-wheat transition-colors font-medium text-sm group z-50"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver al inicio
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-wheat/10 rounded-xl">
              <Leaf className="w-6 h-6 text-wheat" />
            </div>
          </div>
          <h1 className="font-serif text-4xl text-slate-800 tracking-tight">
            WheatGuard <span className="italic text-wheat font-normal">AI</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            Sistema de Diagnóstico V2.4
          </p>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-10">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="upload-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <UploadBox 
                  file={file} 
                  onFileSelect={setFile} 
                  previewUrl={previewUrl} 
                />

                {/* NUEVO: Selector de Modelos UI */}
                {/* Selector de Modelos UI (Ahora con 3 opciones) */}
                <div className="flex justify-center mb-4 w-full max-w-lg mx-auto">
                  <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex w-full shadow-inner">
                    <button
                      onClick={() => setModeloSeleccionado("segformer")}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        modeloSeleccionado === "segformer" 
                          ? "bg-white text-wheat shadow-sm ring-1 ring-slate-100" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Híbrido U-Net
                    </button>
                    <button
                      onClick={() => setModeloSeleccionado("hibrido")}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        modeloSeleccionado === "hibrido" 
                          ? "bg-white text-wheat shadow-sm ring-1 ring-slate-100" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Segformer
                    </button>
                    {/* EL TERCER BOTÓN */}
                    <button
                      onClick={() => setModeloSeleccionado("dinov2")}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        modeloSeleccionado === "dinov2" 
                          ? "bg-white text-wheat shadow-sm ring-1 ring-slate-100" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Dinov2
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleDiagnose}
                    disabled={!file || isLoading}
                    className={`
                      relative group flex items-center gap-3 px-8 py-4 rounded-full font-semibold transition-all duration-300
                      ${!file || isLoading 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-wheat text-white shadow-lg shadow-wheat/30 hover:shadow-wheat/40 hover:-translate-y-0.5 active:translate-y-0'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {/* ACTUALIZADO: Texto dinámico de carga */}
                        <span>Procesando
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Diagnosticar Cultivo</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <Results 
                originalImage={previewUrl!} 
                result={result} 
                onReset={handleReset} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer Decoration */}
        <div className="h-2 w-full bg-gradient-to-r from-wheat/20 via-wheat to-wheat/20" />
      </motion.div>
    </div>
  );
}