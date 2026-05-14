import { AlertCircle, RefreshCw, BarChart3, Image as ImageIcon, ScanSearch, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface DiagnosisResult {
  pathologies: { name: string; severity_pct: number; confidence: number }[];
  overall_severity_pct: number;
  miou: number;
  maskUrl: string;
  modeloUsado?: string;
}

interface ResultsProps {
  originalImage: string;
  result: DiagnosisResult;
  onReset: () => void;
}

export default function Results({ originalImage, result, onReset }: ResultsProps) {
  const nombresModelos: Record<string, string> = {
    hibrido: 'Híbrido'
  };
  
  const nombreModeloFormateado = result.modeloUsado ? nombresModelos[result.modeloUsado] ?? 'Modelo IA' : 'Modelo IA';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
      
      {/* 1. SECCIÓN DE IMÁGENES */}
      <div className="flex flex-col gap-6">
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex justify-center">
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2 z-10 shadow-sm">
            <ImageIcon className="w-3 h-3 text-wheat" /> Original
          </div>
          <img src={originalImage} alt="Original" className="w-full h-auto max-h-[400px] object-contain" />
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 flex justify-center">
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xs font-semibold text-white flex items-center gap-2 z-20 border border-white/10">
            <ScanSearch className="w-3 h-3 text-wheat" /> {nombreModeloFormateado}
          </div>
          <div className="relative w-full flex justify-center">
            <img src={originalImage} alt="Base" className="w-full h-auto max-h-[400px] object-contain" />
            <img src={result.maskUrl} alt="Máscara" className="absolute top-0 left-0 w-full h-full object-contain mix-blend-normal" />
          </div>
        </div>
      </div>

      {/* 2. DAÑO GLOBAL Y MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {/* Tarjeta de Afectación Global */}
        <div className="p-5 bg-red-50/50 rounded-xl border border-red-100 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1 text-red-500">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Afectación Global</span>
          </div>
          <div className="flex items-end gap-1 mt-2">
            <span className="text-4xl font-serif font-bold text-red-600">{result.overall_severity_pct.toFixed(1)}</span>
            <span className="text-lg text-red-500 font-semibold mb-1">%</span>
          </div>
          <span className="text-[10px] text-red-400 mt-1">del área foliar</span>
        </div>

        {/* Tarjeta de mIoU */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Precisión mIoU</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-serif font-bold text-slate-800">
              {result.miou ? (result.miou * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(result.miou || 0) * 100}%` }} className="h-full bg-wheat" />
          </div>
        </div>
      </div>

      {/* 3. DESGLOSE DETALLADO DE PATOLOGÍAS */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-700">
          <AlertCircle className="w-5 h-5 text-wheat" />
          <span className="text-sm font-bold uppercase tracking-wider">Desglose de Patologías</span>
        </div>
        
        <div className="space-y-4">
          {result.pathologies.map((p, i) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">{p.name}</span>
                <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-1 rounded shadow-sm border border-slate-200">
                  Severidad: {p.severity_pct.toFixed(2)}%
                </span>
              </div>
              
              {/* Barra de Confianza de la IA */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold w-16">Confianza</span>
                <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${p.confidence * 100}%` }} 
                    className="h-full bg-emerald-400"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{(p.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTÓN DE REINICIO */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-wheat transition-colors text-sm font-medium border border-transparent hover:border-wheat/20 rounded-full"
        >
          <RefreshCw className="w-4 h-4" /> Realizar otro diagnóstico
        </button>
      </div>
    </motion.div>
  );
}