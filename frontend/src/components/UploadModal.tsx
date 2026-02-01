import React, { useRef, useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setStatus('error');
        setErrorMessage('Arquivo muito grande (Máx 10MB)');
        return;
      }
      setFile(selected);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Erro no upload');
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-gray-800">Upload de Arquivo</h3>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".png,.jpg,.jpeg,.pdf,.txt"
          />
          
          {file ? (
            <div className="text-sm font-medium text-indigo-600 truncate px-4">
              {file.name}
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <UploadCloud size={40} className="mb-2" />
              <p>Clique para selecionar</p>
              <span className="text-xs text-gray-400 mt-1">PDF, Imagens ou TXT (Max 10MB)</span>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'uploading' && (
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-gray-500">{progress}%</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600 font-medium">
            <CheckCircle size={20} />
            <span>Upload concluído!</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || status === 'uploading' || status === 'success'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'uploading' ? 'Enviando...' : 'Enviar Arquivo'}
          </button>
        </div>
      </div>
    </div>
  );
};