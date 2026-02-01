import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { formatBytes, formatDate, downloadBlob } from '../lib/utils'; 
import { UploadModal } from '../components/UploadModal';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { 
  FileText, Download, Trash2, Share2, Plus, Loader2, 
  Image as ImageIcon, Eye, History, ChevronDown, ChevronUp 
} from 'lucide-react';

interface FileVersion {
  id: number;
  size: number;
  version_number: number;
  created_at: string;
}

interface FileData {
  id: number;
  original_name: string;
  content_type: string;
  created_at: string;
  current_version: FileVersion;
  versions: FileVersion[];
}

export const Home = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<number | null>(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{id: number, name: string} | null>(null);
  
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files/');
      setFiles(response.data);
    } catch (error) {
      console.error("Erro ao buscar arquivos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const toggleVersions = (id: number) => {
    setExpandedFileId(expandedFileId === id ? null : id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este arquivo e TODAS as suas versões?')) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (expandedFileId === id) setExpandedFileId(null);
    } catch (error) {
      alert('Erro ao deletar arquivo');
    }
  };

  const handleDeleteVersion = async (versionId: number, fileId: number) => {
    if (!confirm('Deletar esta versão específica?')) return;
    try {
      await api.delete(`/files/versions/${versionId}`);
      
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          const newVersions = f.versions.filter(v => v.id !== versionId);
          if (newVersions.length === 0) return null; 
          return {
            ...f,
            versions: newVersions,
            current_version: newVersions[0] 
          };
        }
        return f;
      }).filter(Boolean) as FileData[]);
      
    } catch (error) {
      alert('Erro ao deletar versão');
    }
  };

  const handleDownload = async (fileId: number, fileName: string, versionId: number | null = null) => {
    const lockId = versionId || fileId; 
    setDownloadingId(lockId);
    
    try {
      const endpoint = versionId 
        ? `/files/versions/${versionId}/download` 
        : `/files/${fileId}/download`;

      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const name = versionId ? `(v${versionId}) ${fileName}` : fileName;
      downloadBlob(response.data, name);
      
    } catch (error) {
      alert('Erro ao baixar arquivo');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (id: number) => {
    try {
      const response = await api.get(`/files/${id}/share`);
      await navigator.clipboard.writeText(response.data.url);
      alert('Link copiado! (Válido por 1h)');
    } catch (error) {
      alert('Erro ao gerar link');
    }
  };

  const isImage = (contentType: string) => contentType.startsWith('image/');

  const getIcon = (type: string) => {
    if (isImage(type)) return <ImageIcon size={20} className="text-purple-500" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    return <FileText size={20} className="text-gray-500" />;
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Arquivos</h1>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Novo Upload
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="animate-spin" /> Carregando...
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p>Você ainda não enviou nenhum arquivo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Tamanho</th>
                  <th className="px-6 py-3">Versão Atual</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((file) => (
                  <React.Fragment key={file.id}>
                    <tr className={`transition-colors ${expandedFileId === file.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        {getIcon(file.content_type)}
                        <span className="truncate max-w-xs" title={file.original_name}>
                          {file.original_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatBytes(file.current_version.size)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          v{file.current_version.version_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(file.current_version.created_at)}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {isImage(file.content_type) && (
                          <button onClick={() => setPreviewFile({id: file.id, name: file.original_name})} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full" title="Visualizar">
                            <Eye size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownload(file.id, file.original_name)} 
                          disabled={downloadingId === file.id}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" 
                          title="Download Atual"
                        >
                          {downloadingId === file.id ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
                        </button>
                        <button onClick={() => handleShare(file.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Compartilhar">
                          <Share2 size={18} />
                        </button>
                        <button onClick={() => toggleVersions(file.id)} className={`p-2 rounded-full ${expandedFileId === file.id ? 'text-indigo-600 bg-indigo-100' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Versões">
                          {expandedFileId === file.id ? <ChevronUp size={18} /> : <History size={18} />}
                        </button>
                        <button onClick={() => handleDelete(file.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>

                    {expandedFileId === file.id && (
                      <tr className="bg-gray-50/80 animate-fadeIn">
                        <td colSpan={5} className="px-6 py-4 shadow-inner">
                          <div className="ml-8 border-l-2 border-indigo-200 pl-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Histórico de Versões</h4>
                            <div className="space-y-2">
                              {file.versions.map((version) => (
                                <div key={version.id} className="flex items-center justify-between text-sm bg-white p-3 rounded border border-gray-100 shadow-sm">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">v{version.version_number}</span>
                                    <span className="text-gray-600">{formatBytes(version.size)}</span>
                                    <span className="text-gray-400 text-xs">{formatDate(version.created_at)}</span>
                                    {version.version_number === file.current_version.version_number && (
                                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">Atual</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleDownload(file.id, file.original_name, version.id)}
                                      className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-gray-100 rounded" title="Baixar esta versão"
                                    >
                                      {downloadingId === version.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
                                    </button>
                                    <button onClick={() => handleDeleteVersion(version.id, file.id)} className="text-gray-400 hover:text-red-600 p-1 hover:bg-gray-100 rounded" title="Deletar versão">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={fetchFiles} />
      <ImagePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} fileId={previewFile?.id || null} fileName={previewFile?.name || ''} />
    </Layout>
  );
};