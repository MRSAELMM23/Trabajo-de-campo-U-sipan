import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types/cartography';
import {
  renderCartography,
  SATELLITE_IMAGE_PATH,
  HUACA_CLOSEUP_IMAGE_PATH,
} from '../utils/cartographyEngine';
import { X, Download, AlertCircle, CheckCircle, Video, HardDrive, ExternalLink } from 'lucide-react';
import { uploadVideoToDrive, getAccessToken } from '../services/googleDrive';

interface VideoExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  totalDurationSeconds: number;
  onOpenDriveModal?: () => void;
}

export const VideoExporterModal: React.FC<VideoExporterModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  totalDurationSeconds,
  onOpenDriveModal,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('Listo para generar');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveUploadedUrl, setDriveUploadedUrl] = useState<string | null>(null);
  const [autoUploadDrive, setAutoUploadDrive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Limpiar URL temporal al desmontar
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!isOpen) return null;

  const startExport = async () => {
    try {
      setIsRecording(true);
      setErrorMsg(null);
      setDownloadUrl(null);
      setProgressPercent(0);
      setStatusText('Inicializando lienzo de alta resolución 1080p...');

      // Crear canvas offscreen de 1920x1080 Full HD
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1920;
      exportCanvas.height = 1080;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D para la grabación.');
      }

      // Cargar imágenes satelitales
      setStatusText('Cargando texturas satelitales de alta resolución...');
      const satImg = new Image();
      satImg.crossOrigin = 'anonymous';
      satImg.src = SATELLITE_IMAGE_PATH;

      const huacaImg = new Image();
      huacaImg.crossOrigin = 'anonymous';
      huacaImg.src = HUACA_CLOSEUP_IMAGE_PATH;

      await Promise.all([
        new Promise((res) => {
          satImg.onload = res;
          satImg.onerror = res;
        }),
        new Promise((res) => {
          huacaImg.onload = res;
          huacaImg.onerror = res;
        }),
      ]);

      // Verificar soporte de MediaRecorder y stream
      if (typeof exportCanvas.captureStream !== 'function') {
        throw new Error('La API canvas.captureStream() no está disponible en este navegador.');
      }

      const stream = exportCanvas.captureStream(60); // 60 FPS
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps para calidad HD nítida
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        recorder.onerror = (e) => reject(e);
      });

      recorder.start();

      // Renderizar 18 segundos de animación frame a frame a 60 fps
      const fps = 60;
      const totalFrames = Math.round(totalDurationSeconds * fps);
      setStatusText('Grabando animación cinematográfica (0% - 100%)...');

      for (let frame = 0; frame <= totalFrames; frame++) {
        const t = frame / totalFrames;
        const pulseTime = frame / fps;

        renderCartography(
          ctx,
          1920,
          1080,
          t,
          viewMode,
          satImg,
          huacaImg,
          pulseTime,
          true
        );

        // Actualizar porcentaje de exportación
        if (frame % 15 === 0 || frame === totalFrames) {
          const pct = Math.round((frame / totalFrames) * 100);
          setProgressPercent(pct);
          setStatusText(`Procesando fotograma ${frame} de ${totalFrames} (${pct}%)...`);
          // Ceder microtarea para mantener la UI responsiva
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      // Detener grabación
      setStatusText('Finalizando codificación de video WebM...');
      recorder.stop();
      const videoBlob = await recordPromise;

      setRecordedBlob(videoBlob);
      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);
      setIsRecording(false);
      setStatusText('¡Video generado con éxito en resolución Full HD 1080p!');

      // Descarga automática inmediata
      const fileName = `Recorrido_Ucupe_Huaca_El_Pueblo_${new Date().toISOString().slice(0, 10)}.webm`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Si tiene activado autoupload a Drive y tiene token o cuenta
      if (autoUploadDrive) {
        try {
          const token = await getAccessToken();
          if (token) {
            setIsUploadingDrive(true);
            const uploaded = await uploadVideoToDrive(
              videoBlob,
              fileName,
              'Animación cartográfica documental del recorrido peatonal en Úcupe (Lambayeque, 07/11/2026)'
            );
            setDriveUploadedUrl(uploaded.webViewLink || 'https://drive.google.com/drive/my-drive');
          }
        } catch (uploadErr) {
          console.warn('Auto upload a Drive requirió autorización:', uploadErr);
        } finally {
          setIsUploadingDrive(false);
        }
      }
    } catch (err: unknown) {
      console.error('Error al exportar video:', err);
      setIsRecording(false);
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado al codificar el video.');
    }
  };

  const handleDriveUpload = async () => {
    if (!recordedBlob) return;
    setIsUploadingDrive(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      if (!token && onOpenDriveModal) {
        onOpenDriveModal();
        setIsUploadingDrive(false);
        return;
      }

      const fileName = `Recorrido_Ucupe_Huaca_El_Pueblo_${new Date().toISOString().slice(0, 10)}.webm`;
      const uploaded = await uploadVideoToDrive(
        recordedBlob,
        fileName,
        'Animación cartográfica documental del recorrido peatonal en Úcupe (Lambayeque, 07/11/2026)'
      );

      setDriveUploadedUrl(uploaded.webViewLink || 'https://drive.google.com/drive/my-drive');
      setStatusText('¡Video subido exitosamente a Google Drive!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir a Google Drive');
    } finally {
      setIsUploadingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-100 font-display font-bold">
            <Video className="w-5 h-5 text-amber-400" />
            <span>Exportador de Video HD (WebM)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parámetros de la exportación */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 font-mono-num">
            <div className="flex justify-between">
              <span className="text-slate-400">Resolución:</span>
              <span className="font-semibold text-white">1920 × 1080 (Full HD 16:9)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tasa de cuadros:</span>
              <span className="text-white">60 fps (fluidez cinematográfica)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duración:</span>
              <span className="text-white">{totalDurationSeconds} segundos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Formato:</span>
              <span className="text-amber-400 font-semibold">WebM (VP9/VP8)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capa seleccionada:</span>
              <span className="text-slate-200 capitalize">{viewMode}</span>
            </div>
          </div>

          {!downloadUrl && !isRecording && (
            <label className="flex items-center gap-2 cursor-pointer select-none p-2 bg-slate-950/40 rounded-lg border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={autoUploadDrive}
                onChange={(e) => setAutoUploadDrive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 accent-amber-400"
              />
              <span className="text-[11.5px] text-slate-300">
                Guardar automáticamente en mi <strong>Google Drive ('Mi unidad')</strong> al terminar
              </span>
            </label>
          )}

          <p className="text-slate-400 leading-relaxed text-[11px]">
            Se capturará el recorrido completo de los 5 estudiantes universitarios desde el centro poblado de Úcupe hasta la Huaca El Pueblo.
          </p>
        </div>

        {/* Barra de progreso durante la grabación */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-num">
              <span className="text-amber-300 font-medium">{statusText}</span>
              <span className="text-white font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensaje de éxito tras generar */}
        {downloadUrl && !isRecording && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-3 text-xs text-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-emerald-300">¡Video generado y descargado a tu PC!</p>
                <p className="text-emerald-300/80 text-[11px]">
                  El archivo se encuentra en tu carpeta local de <strong>Descargas (Downloads)</strong>.
                </p>
              </div>
            </div>

            {/* Estado de Google Drive */}
            <div className="p-3.5 bg-blue-950/30 border border-blue-800/50 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-blue-300">
                <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Almacenamiento en Google Drive ('Mi unidad')</span>
              </div>

              {driveUploadedUrl ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[11.5px] text-emerald-300 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Guardado exitosamente en la raíz de tu Google Drive!</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href={driveUploadedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
                    >
                      <span>Abrir en Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {onOpenDriveModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDriveModal();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs"
                      >
                        Ver lista
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-blue-300/90 leading-relaxed">
                    Si deseas que el video esté disponible en tu almacenamiento en la nube, pulsa el botón para subirlo directamente a la carpeta raíz de Google Drive:
                  </p>
                  <button
                    type="button"
                    onClick={handleDriveUpload}
                    disabled={isUploadingDrive}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>{isUploadingDrive ? 'Subiendo a Google Drive...' : 'Guardar en Google Drive ("Mi unidad")'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl flex items-center gap-3 text-xs text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {downloadUrl ? 'Cerrar' : 'Cancelar'}
          </button>

          {!downloadUrl ? (
            <button
              type="button"
              onClick={startExport}
              disabled={isRecording}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isRecording ? 'Generando...' : 'Iniciar Grabación HD'}</span>
            </button>
          ) : (
            <a
              href={downloadUrl}
              download="Recorrido_Ucupe_Huaca_El_Pueblo.webm"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Volver a descargar en PC</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
