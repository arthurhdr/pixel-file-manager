import React, { useEffect, useState } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number | null;
  fileName: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  fileId,
  fileName 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && fileId) {
      loadImage();
    } else {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
      setError(false);
    }
  }, [isOpen, fileId]);

  const loadImage = async () => {
    if (!fileId) return;
    setLoading(true);
    setError(false);
    
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setImageUrl(url);
    } catch (err) {
      console.error("Erro ao carregar imagem", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900 truncate pr-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-purple-600"/>
            {fileName}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[300px] p-4">
          {loading ? (
            <div className="flex flex-col items-center text-gray-500">
              <Loader2 className="animate-spin mb-2" size={32} />
              <span>Carregando preview...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">
              <p>Não foi possível carregar a pré-visualização.</p>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={fileName} 
              className="max-w-full max-h-[70vh] object-contain shadow-sm rounded" 
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};