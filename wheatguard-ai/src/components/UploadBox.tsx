import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadBoxProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
}

export default function UploadBox({ file, onFileSelect, previewUrl }: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      onFileSelect(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-wheat hover:bg-wheat/5 transition-all duration-300"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleChange}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full group-hover:bg-wheat/10 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-wheat transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="font-serif text-xl text-slate-700">Subir Muestra Foliar</h3>
                <p className="text-sm text-slate-500 mt-1">Arrastra una imagen o haz clic para buscar</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-100 shadow-inner"
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10 group" />
            <button
              onClick={removeFile}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg transition-all hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" />
              {file?.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
