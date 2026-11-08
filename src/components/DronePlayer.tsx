import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderDroneShot } from '../utils/droneEngine';
import { SATELLITE_IMAGE_PATH, HUACA_CLOSEUP_IMAGE_PATH } from '../utils/cartographyEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Video,
  HardDrive,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  X,
} from 'lucide-react';

interface DronePlayerProps {
  onSwitchToMapMode: () => void;
  onOpenDriveModal?: () => void;
}

export const DronePlayer: React.FC<DronePlayerProps> = ({ onSwitchToMapMode, onOpenDriveModal }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const satelliteImgRef = useRef<HTMLImageElement | null>(null);
  const huacaCloseupImgRef = useRef<HTMLImageElement | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedSecRef = useRef<number>(0);

  const totalDurationSeconds = 10; // 10 segundos (rango 8 a 12s)

  // Carga de imágenes
  useEffect(() => {
    const satImg = new Image();
    satImg.crossOrigin = 'anonymous';
    satImg.src = SATELLITE_IMAGE_PATH;
    satImg.onload = () => {
      satelliteImgRef.current = satImg;
    };

    const huacaImg = new Image();
    huacaImg.crossOrigin = 'anonymous';
    huacaImg.src = HUACA_CLOSEUP_IMAGE_PATH;
    huacaImg.onload = () => {
      huacaCloseupImgRef.current = huacaImg;
    };
  }, []);

  // Frame render
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderDroneShot(
      ctx,
      canvas.width,
      canvas.height,
      progress,
      satelliteImgRef.current,
      huacaCloseupImgRef.current,
      elapsedSecRef.current
    );
  }, [progress]);

  // Bucle de animación 60 FPS
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        elapsedSecRef.current += deltaSeconds;

        const deltaProgress = (deltaSeconds * speed) / totalDurationSeconds;

        setProgress((prev) => {
          const next = prev + deltaProgress;
          if (next >= 1.0) {
            if (isLooping) {
              return 0.0;
            }
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });
      }

      lastTimeRef.current = now;
      renderFrame();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      lastTimeRef.current = null;
    };
  }, [isPlaying, speed, isLooping, totalDurationSeconds, renderFrame]);

  // Canvas size setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1920;
    canvas.height = 1080;
    renderFrame();
  }, [renderFrame]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveUploadSuccessUrl, setDriveUploadSuccessUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportDroneVideo = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setDriveUploadSuccessUrl(null);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1920;
      exportCanvas.height = 1080;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el contexto.');

      const stream = exportCanvas.captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10000000, // 10 Mbps para alta definición
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.onerror = (e) => reject(e);
      });

      recorder.start();

      const fps = 60;
      const totalFrames = Math.round(totalDurationSeconds * fps);

      for (let frame = 0; frame <= totalFrames; frame++) {
        const t = frame / totalFrames;
        const timeSec = frame / fps;

        renderDroneShot(
          ctx,
          1920,
          1080,
          t,
          satelliteImgRef.current,
          huacaCloseupImgRef.current,
          timeSec
        );

        if (frame % 20 === 0 || frame === totalFrames) {
          setExportProgress(Math.round((frame / totalFrames) * 100));
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      recorder.stop();
      const videoBlob = await recordPromise;
      setExportedBlob(videoBlob);
      const url = URL.createObjectURL(videoBlob);
      setExportedUrl(url);

      setIsExporting(false);
      setIsExportModalOpen(true);

      // Descarga automática en local
      const a = document.createElement('a');
      a.href = url;
      a.download = `Toma_Aerea_Dron_Ucupe_Huaca_${new Date().toISOString().slice(0, 10)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error(err);
      setIsExporting(false);
      setExportError(err instanceof Error ? err.message : 'Error al exportar video');
      setIsExportModalOpen(true);
    }
  };

  const handleUploadDroneToDrive = async () => {
    if (!exportedBlob) return;
    setIsUploadingToDrive(true);
    setExportError(null);
    try {
      const { uploadVideoToDrive, getAccessToken } = await import('../services/googleDrive');
      const token = await getAccessToken();
      if (!token && onOpenDriveModal) {
        onOpenDriveModal();
        setIsUploadingToDrive(false);
        return;
      }

      const fileName = `Toma_Aerea_Dron_Ucupe_Huaca_${new Date().toISOString().slice(0, 10)}.webm`;
      const uploaded = await uploadVideoToDrive(
        exportedBlob,
        fileName,
        'Toma aérea cinematográfica tipo dron del centro poblado Úcupe y Huaca El Pueblo (Lambayeque, 07/11/2026)'
      );

      setDriveUploadSuccessUrl(uploaded.webViewLink || 'https://drive.google.com/drive/my-drive');
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Error al subir a Google Drive');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const currentSeconds = Math.min(totalDurationSeconds, progress * totalDurationSeconds);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Contenedor del video 16:9 LIMPIO (sin textos sobre la imagen) */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block cursor-pointer"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setIsPlaying(!isPlaying)}
        />

        {/* Modal de progreso de exportación */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-white gap-3 z-30">
            <Video className="w-8 h-8 text-amber-400 animate-pulse" />
            <div className="text-sm font-semibold">Generando Toma Aérea Dron Full HD 1080p...</div>
            <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400">{exportProgress}%</span>
          </div>
        )}
      </div>

      {/* Controles del metraje aéreo (situados debajo de la imagen, respetando la pureza de la toma) */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
        {/* Barra de tiempo y estado cinemático */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold">{currentSeconds.toFixed(1)}s</span>
            <span className="text-slate-600">/</span>
            <span>{totalDurationSeconds.toFixed(1)}s</span>
            <span className="text-slate-500 text-[11px] ml-2">
              (Toma cinematográfica continua 16:9)
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            {progress < 0.25 && 'Fase 1: Vista aérea elevada sobre Úcupe'}
            {progress >= 0.25 && progress < 0.55 && 'Fase 2: Avance sobre el poblado y camino sur'}
            {progress >= 0.55 && progress < 0.82 && 'Fase 3: Aproximación hacia Huaca El Pueblo'}
            {progress >= 0.82 && 'Fase 4: Elevación territorial y encuadre de contexto'}
          </div>
        </div>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.002}
          value={progress}
          onChange={(e) => setProgress(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          aria-label="Línea de tiempo de la toma aérea"
        />

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-md active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Reiniciar toma"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Selector de velocidad */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 ml-2">
              {[0.5, 1, 1.5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                    speed === s ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ml-1 ${
                isLooping ? 'bg-slate-800 text-amber-300 font-medium' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Reproducción continua en bucle"
            >
              Bucle {isLooping ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToMapMode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              Volver a Navegación Cartográfica
            </button>

            {onOpenDriveModal && (
              <button
                type="button"
                onClick={onOpenDriveModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold transition-colors"
                title="Abrir panel de Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportDroneVideo}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exportando...' : 'Descargar Video Dron HD'}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Pantalla completa"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de exportación y subida a Google Drive */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-100 font-display font-bold">
                <Video className="w-5 h-5 text-amber-400" />
                <span>Toma Aérea Dron Exportada</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-3 text-xs text-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-300">¡Video WebM 1080p generado con éxito!</p>
                <p className="text-emerald-300/80">
                  El archivo se ha descargado a tu carpeta local de <strong>Descargas (Downloads)</strong> en tu computadora.
                </p>
              </div>
            </div>

            {/* Aclaración sobre Google Drive */}
            <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs space-y-2 text-blue-200">
              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>¿Deseas tenerlo en tu Google Drive?</span>
              </div>
              <p className="text-[11.5px] text-blue-300/90 leading-relaxed">
                Para que el video esté disponible en tu almacenamiento en la nube de Google Drive, guárdalo directamente en la <strong>carpeta raíz ('Mi unidad')</strong>.
              </p>

              {driveUploadSuccessUrl ? (
                <div className="pt-2 space-y-2">
                  <div className="p-2.5 bg-emerald-900/40 border border-emerald-700/60 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>¡Guardado con éxito en la raíz de tu Google Drive!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={driveUploadSuccessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
                    >
                      <span>Abrir en Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {onOpenDriveModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportModalOpen(false);
                          onOpenDriveModal();
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium"
                      >
                        Ver lista
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUploadDroneToDrive}
                  disabled={isUploadingToDrive}
                  className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>{isUploadingToDrive ? 'Subiendo a Google Drive...' : 'Guardar en mi Google Drive'}</span>
                </button>
              )}
            </div>

            {exportError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              {exportedUrl && (
                <a
                  href={exportedUrl}
                  download="Toma_Aerea_Dron_Ucupe_Huaca.webm"
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Volver a descargar en PC</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors ml-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
