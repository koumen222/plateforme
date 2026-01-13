import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config';
import { FiUpload, FiX, FiFile, FiTrash2, FiDownload, FiFolder, FiImage, FiFileText, FiVideo, FiMusic, FiArchive } from 'react-icons/fi';

export default function FileManagerPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [folder, setFolder] = useState('/');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFiles();
    } else {
      setLoading(false);
      setError('Vous devez être connecté pour accéder à vos fichiers');
    }
  }, [isAuthenticated, token, folder]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${CONFIG.BACKEND_URL}/api/files${folder !== '/' ? `?folder=${encodeURIComponent(folder)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors du chargement des fichiers');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
      setError(err.message || 'Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList) => {
    if (!token) {
      setError('Vous devez être connecté pour uploader des fichiers');
      return;
    }

    const filesArray = Array.from(fileList);
    
    // Vérifier la taille des fichiers (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = filesArray.filter(f => f.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Certains fichiers dépassent la limite de 50MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    filesArray.forEach(file => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const xhr = new XMLHttpRequest();

      // Suivi de la progression
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded * 100) / e.total);
          setUploadProgress({ overall: percentComplete });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress({});
          fetchFiles(); // Recharger la liste
          setError(null);
        } else {
          const errorData = JSON.parse(xhr.responseText || '{}');
          throw new Error(errorData.error || 'Erreur lors de l\'upload');
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Erreur réseau lors de l\'upload');
      });

      xhr.open('POST', `${CONFIG.BACKEND_URL}/api/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

      // Attendre la fin de l'upload
      await new Promise((resolve, reject) => {
        xhr.addEventListener('loadend', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(xhr.responseText || 'Erreur upload'));
          }
        });
      });

    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err.message || 'Erreur lors de l\'upload des fichiers');
      setUploadProgress({});
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Retirer le fichier de la liste
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError(err.message || 'Erreur lors de la suppression du fichier');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <FiImage className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <FiVideo className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <FiMusic className="w-5 h-5" />;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return <FiFileText className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <FiArchive className="w-5 h-5" />;
    return <FiFile className="w-5 h-5" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/10 flex items-center justify-center p-4">
        <div className="card-startup max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Accès non autorisé</h2>
          <p className="text-secondary">Vous devez être connecté pour accéder à vos fichiers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/10 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Gestionnaire de fichiers</h1>
          <p className="text-secondary">Téléchargez, organisez et gérez vos fichiers</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <FiX className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-8 p-8 border-2 border-dashed rounded-xl transition-all ${
            dragActive
              ? 'border-accent bg-accent/10'
              : 'border-theme bg-secondary/50 hover:border-accent/50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="text-center">
            <FiUpload className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              Glissez-déposez vos fichiers ici
            </h3>
            <p className="text-secondary mb-4">
              ou{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-accent hover:text-accent-hover font-medium underline"
                disabled={uploading}
              >
                parcourez vos fichiers
              </button>
            </p>
            <p className="text-xs text-secondary">
              Taille maximale : 50MB par fichier • Maximum 10 fichiers par upload
            </p>
            
            {uploading && uploadProgress.overall !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-secondary rounded-full h-2 mb-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.overall}%` }}
                  />
                </div>
                <p className="text-sm text-secondary">Upload en cours... {uploadProgress.overall}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="card-startup p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">Chargement des fichiers...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="card-startup p-12 text-center">
            <FiFolder className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-secondary text-lg">Aucun fichier pour le moment</p>
            <p className="text-secondary text-sm mt-2">Commencez par uploader vos premiers fichiers</p>
          </div>
        ) : (
          <div className="card-startup overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 border-b border-theme">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Fichier</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Taille</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-accent">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div>
                            <p className="text-primary font-medium">{file.originalName}</p>
                            <p className="text-xs text-secondary">{file.mimeType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary text-sm">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 text-secondary text-sm">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <FiDownload className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


