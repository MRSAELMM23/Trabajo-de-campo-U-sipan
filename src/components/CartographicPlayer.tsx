import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ViewMode, PlaybackSpeed, Waypoint } from '../types/cartography';
import {
  renderCartography,
  SATELLITE_IMAGE_PATH,
  HUACA_CLOSEUP_IMAGE_PATH,
  getPathInterpolation,
} from '../utils/cartographyEngine';
import { WAYPOINTS } from '../data/routeData';

interface CartographicPlayerProps {
  progress: number;
  setProgress: (p: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: PlaybackSpeed;
  viewMode: ViewMode;
  totalDurationSeconds: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onWaypointReached?: (wp: Waypoint) => void;
  onFinished?: () => void;
}

export const CartographicPlayer: React.FC<CartographicPlayerProps> = ({
  progress,
  setProgress,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  viewMode,
  totalDurationSeconds,
  canvasRef,
  onWaypointReached,
  onFinished,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const satelliteImgRef = useRef<HTMLImageElement | null>(null);
  const huacaCloseupImgRef = useRef<HTMLImageElement | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pulseTimeRef = useRef<number>(0);
  const lastActiveWpIdRef = useRef<number | null>(null);

  // Pre-carga de imágenes satelitales
  useEffect(() => {
    let loadedCount = 0;
    const totalToLoad = 2;

    const satImg = new Image();
    satImg.crossOrigin = 'anonymous';
    satImg.src = SATELLITE_IMAGE_PATH;
    satImg.onload = () => {
      loadedCount++;
      satelliteImgRef.current = satImg;
      if (loadedCount >= totalToLoad) setImagesLoaded(true);
    };
    satImg.onerror = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) setImagesLoaded(true);
    };

    const huacaImg = new Image();
    huacaImg.crossOrigin = 'anonymous';
    huacaImg.src = HUACA_CLOSEUP_IMAGE_PATH;
    huacaImg.onload = () => {
      loadedCount++;
      huacaCloseupImgRef.current = huacaImg;
      if (loadedCount >= totalToLoad) setImagesLoaded(true);
    };
    huacaImg.onerror = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) setImagesLoaded(true);
    };

    return () => {
      satImg.onload = null;
      huacaImg.onload = null;
    };
  }, []);

  // Bucle de renderizado y animación
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCartography(
      ctx,
      canvas.width,
      canvas.height,
      progress,
      viewMode,
      satelliteImgRef.current,
      huacaCloseupImgRef.current,
      pulseTimeRef.current,
      true
    );
  }, [canvasRef, progress, viewMode]);

  // Actualización de frames mediante requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        const deltaProgress = (deltaSeconds * playbackSpeed) / totalDurationSeconds;

        pulseTimeRef.current += deltaSeconds;

        setProgress((prev) => {
          const next = prev + deltaProgress;
          if (next >= 1.0) {
            setIsPlaying(false);
            if (onFinished) onFinished();
            return 1.0;
          }
          return next;
        });
      } else {
        // En pausa, mantener animación de pulso sutil en el cursor
        pulseTimeRef.current += 0.016;
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
  }, [isPlaying, playbackSpeed, totalDurationSeconds, renderFrame, setProgress, setIsPlaying, onFinished]);

  // Notificar cuando se alcanza un nuevo hito
  useEffect(() => {
    const { activeWaypoint } = getPathInterpolation(progress);
    if (activeWaypoint && activeWaypoint.id !== lastActiveWpIdRef.current) {
      lastActiveWpIdRef.current = activeWaypoint.id;
      if (onWaypointReached) {
        onWaypointReached(activeWaypoint);
      }
    }
  }, [progress, onWaypointReached]);

  // Redimensionar canvas manteniendo siempre proporción nativa 1920x1080
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1920;
    canvas.height = 1080;
    renderFrame();
  }, [canvasRef, renderFrame, imagesLoaded]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain block"
        style={{ aspectRatio: '16/9' }}
      />

      {/* Indicador de carga inicial suave */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-300 gap-3 z-30">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Cargando cartografía y fotografía satelital de Úcupe...
          </span>
        </div>
      )}

      {/* Atajo visual rápido para pausar/reanudar clickeando el canvas */}
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10 focus:outline-none pointer-events-auto"
        title={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        <div className="bg-black/40 backdrop-blur-md text-white p-4 rounded-full shadow-lg border border-white/20 transform scale-90 hover:scale-100 transition-transform">
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};
