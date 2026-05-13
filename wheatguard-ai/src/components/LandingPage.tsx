import { motion } from 'motion/react';
import { ArrowRight, Flame, Wind, Bug, Microscope, MousePointer2 } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const diseases = [
  {
    title: "Roya de la Hoja",
    scientific: "Puccinia triticina",
    description: "Se caracteriza por pústulas circulares de color naranja a marrón que aparecen principalmente en las hojas.",
    icon: <Flame className="w-6 h-6 text-orange-600" />,
    bgColor: "bg-orange-50",
    points: ["Pústulas circulares", "Color naranja-marrón", "Dispersión aleatoria"]
  },
  {
    title: "Roya Amarilla",
    scientific: "Puccinia striiformis",
    description: "Forma pústulas amarillas alineadas en estrías o rayas a lo largo de las venas de las hojas.",
    icon: <Wind className="w-6 h-6 text-yellow-600" />,
    bgColor: "bg-yellow-50",
    points: ["Estrías amarillas", "Alineación lineal", "Afecta hojas y espigas"]
  },
  {
    title: "Oidio",
    scientific: "Blumeria graminis",
    description: "Aparece como un polvo blanco algodonoso sobre la superficie de las hojas y tallos.",
    icon: <Bug className="w-6 h-6 text-blue-600" />,
    bgColor: "bg-blue-50",
    points: ["Polvo blanco", "Aspecto algodonoso", "Manchas grises tardías"]
  },
  {
    title: "Septoria",
    scientific: "Septoria tritici",
    description: "Manchas necróticas alargadas que contienen pequeños puntos negros llamados picnidios.",
    icon: <Microscope className="w-6 h-6 text-emerald-600" />,
    bgColor: "bg-emerald-50",
    points: ["Manchas alargadas", "Puntos negros (picnidios)", "Necrosis foliar"]
  }
];

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
            alt="Wheat Field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl space-y-8"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-wheat/30 bg-wheat/10 backdrop-blur-md">
            <span className="text-[10px] font-bold tracking-[0.3em] text-wheat uppercase">
              Inteligencia Artificial Aplicada al Agro
            </span>
          </div>

          <h1 className="font-serif text-7xl md:text-8xl text-white tracking-tight">
            WheatGuard <span className="italic text-wheat font-normal">AI</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            Detección temprana y cuantificación de patologías foliares mediante modelos de segmentación de última generación.
          </p>

          <div className="pt-4">
            <button
              onClick={onStart}
              className="group flex items-center gap-3 px-10 py-5 bg-wheat text-white rounded-full font-semibold text-lg shadow-2xl shadow-wheat/20 hover:shadow-wheat/40 hover:-translate-y-1 transition-all duration-300"
            >
              <span>Diagnosticar Cultivo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Info Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-[10px] font-bold tracking-[0.3em] text-wheat uppercase block mb-4">
            Conoce las Patologías
          </span>
          <h2 className="font-serif text-5xl text-slate-900 tracking-tight">
            Enfermedades del Trigo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {diseases.map((disease, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group"
            >
              <div className={`w-14 h-14 ${disease.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {disease.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{disease.title}</h3>
              <p className="font-mono text-xs text-slate-400 italic mb-4">{disease.scientific}</p>
              
              <p className="text-slate-600 leading-relaxed mb-6">
                {disease.description}
              </p>

              <ul className="space-y-3">
                {disease.points.map((point, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-wheat/40" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">
          WheatGuard AI • 2026 • Innovación Agrícola
        </p>
      </footer>
    </div>
  );
}
