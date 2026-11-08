import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  initAuth,
  listRootVideoFiles,
  listDriveFiles,
  uploadVideoToDrive,
  deleteDriveFile,
  DriveFileItem,
} from '../services/googleDrive';
import {
  X,
  HardDrive,
  LogOut,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileVideo,
  Calendar,
  Search,
  FolderRoot,
  Upload,
  Info,
  HelpCircle,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  accessToken,
  setAccessToken,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [folderScope, setFolderScope] = useState<'root' | 'all'>('root');
  const [onlyVideos, setOnlyVideos] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DriveFileItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        // Token no disponible en memoria aún
      }
    );
  }, [setCurrentUser, setAccessToken]);

  const loadFiles = async (scope = folderScope, filterVideos = onlyVideos) => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      if (scope === 'root') {
        const rootList = await listRootVideoFiles(filterVideos);
        setFiles(rootList);
      } else {
        const allList = await listDriveFiles(false);
        setFiles(allList);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al consultar archivos en Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFiles(folderScope, onlyVideos);
    }
  }, [isOpen, accessToken, folderScope, onlyVideos]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage('Sesión iniciada con éxito en Google Drive');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al conectar con Google Drive');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setFiles([]);
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLocal(true);
    setErrorMessage(null);
    try {
      setStatusMessage(`Subiendo "${file.name}" a la carpeta raíz de Google Drive...`);
      const uploaded = await uploadVideoToDrive(
        file,
        file.name,
        'Video del trabajo de campo en Úcupe subido manualmente a la carpeta raíz de Google Drive'
      );
      setStatusMessage(`¡"${uploaded.name}" se subió con éxito a la carpeta raíz de tu Google Drive!`);
      loadFiles(folderScope, onlyVideos);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setIsUploadingLocal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmFile) return;
    try {
      await deleteDriveFile(deleteConfirmFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteConfirmFile.id));
      setDeleteConfirmFile(null);
      setStatusMessage('Archivo eliminado de Google Drive.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const formatCreationDate = (isoString?: string) => {
    if (!isoString) return 'Fecha desconocida';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = Number(bytesStr);
    if (isNaN(bytes)) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                Google Drive · Explorador de Videos
              </h2>
              <p className="text-xs text-slate-400">
                Visualización directa de archivos en la carpeta raíz ('Mi unidad') de tu Google Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificaciones */}
        {statusMessage && (
          <div className="px-5 py-2.5 bg-emerald-950/60 border-b border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-950/60 border-b border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!currentUser ? (
            /* Pantalla de inicio de sesión */
            <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <FolderRoot className="w-6 h-6" />
              </div>
              <div className="max-w-md text-xs text-slate-300 leading-relaxed">
                Inicia sesión con tu cuenta de Google para consultar los videos exportados anteriormente que se encuentran en la <strong>carpeta raíz ('Mi unidad')</strong> de tu Google Drive.
              </div>

              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-850 font-medium text-xs rounded-xl shadow-lg border border-slate-300 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Conectando con Google...' : 'Iniciar sesión con Google'}</span>
              </button>
            </div>
          ) : (
            /* Panel autenticado */
            <div className="space-y-4">
              {/* Información del usuario autenticado */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Usuario'}
                      className="w-9 h-9 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{currentUser.displayName || 'Usuario de Google'}</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
                        Conectado
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] font-mono">{currentUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg transition-colors"
                    title="Abrir Mi unidad en la web de Google Drive"
                  >
                    <span>Ir a Google Drive Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => loadFiles(folderScope, onlyVideos)}
                    disabled={isLoadingFiles}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Actualizar lista de archivos"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 rounded-lg transition-colors border border-rose-900/40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>

              {/* Banner informativo de aclaración sobre la ubicación de los archivos */}
              <div className="p-3.5 bg-blue-950/30 border border-blue-800/50 rounded-xl text-xs space-y-2 text-blue-200">
                <div className="flex items-center gap-2 font-semibold text-blue-300">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>¿Por qué no aparecían tus videos en Google Drive?</span>
                </div>
                <p className="leading-relaxed text-[11.5px] text-blue-300/90">
                  Cuando pulsas <strong>"Descargar Video HD"</strong>, el navegador descarga el archivo localmente a tu computadora (en la carpeta <strong>Descargas</strong>). Para que aparezca en tu Google Drive debes presionar <strong>"Guardar en Google Drive"</strong> o subirlo directamente con el botón de abajo:
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,.webm,.mp4"
                    onChange={handleLocalFileUpload}
                    className="hidden"
                    id="local-drive-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLocal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow cursor-pointer disabled:opacity-60"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLocal ? 'Subiendo archivo...' : 'Subir video de mi PC a la carpeta raíz de Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Selector de ámbito y buscador */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFolderScope('root')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      folderScope === 'root'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FolderRoot className="w-3.5 h-3.5" />
                    <span>Carpeta Raíz ('Mi unidad')</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFolderScope('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      folderScope === 'all'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Todo Google Drive</span>
                  </button>
                </div>

                {/* Caja de búsqueda por nombre */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nombre..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Lista de archivos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">
                      {folderScope === 'root'
                        ? 'Archivos en la carpeta raíz (Mi unidad)'
                        : 'Archivos encontrados en Google Drive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOnlyVideos(!onlyVideos)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        onlyVideos
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {onlyVideos ? 'Solo videos' : 'Todos los tipos'}
                    </button>
                  </div>
                  <span className="font-mono-num">{filteredFiles.length} archivo(s)</span>
                </div>

                {isLoadingFiles ? (
                  <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-3 bg-slate-950/40 rounded-xl border border-slate-800">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                    <span>Consultando tu Google Drive...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                    <FileVideo className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-medium text-slate-200">
                      No se encontraron videos en la carpeta raíz de tu Google Drive.
                    </p>
                    <p className="text-[11.5px] text-slate-400 max-w-md mx-auto leading-relaxed">
                      Si descargaste el video en tu navegador, presiona el botón amarillo de arriba <strong>"Subir video de mi PC a la carpeta raíz de Drive"</strong> para transferirlo a Google Drive en pocos segundos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                    {filteredFiles.map((file) => {
                      const extension = file.name.split('.').pop()?.toUpperCase() || 'ARCHIVO';

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-950/80 transition-all text-xs group"
                        >
                          <div className="flex items-start gap-3 truncate mr-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex flex-col items-center justify-center text-amber-400 shrink-0 mt-0.5">
                              <FileVideo className="w-4 h-4" />
                              <span className="text-[8px] font-bold font-mono">{extension}</span>
                            </div>

                            <div className="truncate">
                              {/* Nombre del archivo */}
                              <div className="font-semibold text-white truncate text-[13px] group-hover:text-amber-300 transition-colors">
                                {file.name}
                              </div>

                              {/* Fecha de creación y tamaño */}
                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 mt-1 font-mono-num">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Calendar className="w-3 h-3 text-amber-400" />
                                  <span>{formatCreationDate(file.createdTime)}</span>
                                </span>

                                {file.size && (
                                  <>
                                    <span className="text-slate-600">·</span>
                                    <span>{formatSize(file.size)}</span>
                                  </>
                                )}

                                <span className="text-slate-600">·</span>
                                <span className="text-emerald-400/90 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded text-[10px]">
                                  📁 Raíz ('Mi unidad')
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-2 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg transition-colors"
                              >
                                <span>Abrir en Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmFile(file)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Eliminar de Google Drive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmación para eliminar archivo */}
        {deleteConfirmFile && (
          <div className="p-4 bg-rose-950/70 border-t border-rose-800 text-xs text-rose-200 flex flex-col gap-2">
            <div className="font-semibold text-rose-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>¿Eliminar este archivo de Google Drive?</span>
            </div>
            <p className="text-rose-300/90">
              Se eliminará de tu cuenta de Google Drive el archivo: <strong>{deleteConfirmFile.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmFile(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
              >
                Eliminar de Drive
              </button>
            </div>
          </div>
        )}

        {/* Pie */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
