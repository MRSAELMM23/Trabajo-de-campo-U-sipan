import React from 'react';
import { ViewMode, PlaybackSpeed } from '../types/cartography';
import { WAYPOINTS } from '../data/routeData';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  BookOpen,
  Map as MapIcon,
  Globe,
  Layers,
} from 'lucide-react';

interface PlaybackControlsProps {
  progress: number;
  setProgress: (p: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: PlaybackSpeed;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalDurationSeconds: number;
  onOpenFieldLog: () => void;
  onExportVideo: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  progress,
  setProgress,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  viewMode,
  setViewMode,
  totalDurationSeconds,
  onOpenFieldLog,
  onExportVideo,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const currentSeconds = Math.min(totalDurationSeconds, Math.floor(progress * totalDurationSeconds));
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
  };

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* 1. Línea de tiempo interactiva con hitos numerados */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold">{formatTime(currentSeconds)}</span>
            <span className="text-slate-600">/</span>
            <span>{formatTime(totalDurationSeconds)}</span>
            <span className="text-slate-500 text-[11px] ml-2">
              ({Math.round(progress * 100)}% recorrido)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Recorrido Peatonal (7 de noviembre de 2026)</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="relative flex items-center py-1 group">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            aria-label="Línea de tiempo del recorrido"
          />

          {/* Marcadores de los 6 hitos sobre la barra */}
          {WAYPOINTS.map((wp) => {
            const isReached = progress >= wp.targetProgress;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => setProgress(wp.targetProgress)}
                title={`${wp.id}. ${wp.title}`}
                style={{ left: `${wp.targetProgress * 100}%` }}
                className={`absolute -top-1.5 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-md cursor-pointer ${
                  isReached
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/40'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {wp.numberLabel}
              </button>
            );
          })}
        </div>

        {/* Nombres cortos de los 6 hitos para acceso directo */}
        <div className="grid grid-cols-6 gap-1 pt-1 text-[11px]">
          {WAYPOINTS.map((wp) => {
            const isCurrent = Math.abs(progress - wp.targetProgress) < 0.08;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => setProgress(wp.targetProgress)}
                className={`text-left p-1.5 rounded-lg transition-colors truncate ${
                  isCurrent
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={`${wp.id}. ${wp.title} (${wp.time})`}
              >
                <div className="font-semibold truncate">{wp.id}. {wp.title.includes(':') ? wp.title.split(':')[1].trim() : wp.title}</div>
                <div className="text-[10px] text-slate-500 truncate">{wp.distanceFromStartMeters}m</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Barra de controles principales */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        {/* Zona Izquierda: Reproducción */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-md active:scale-95"
            aria-label={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{progress >= 1 ? 'Repetir' : 'Reproducir'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Reiniciar desde el inicio"
            aria-label="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Selector de velocidad */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 ml-2">
            {([0.5, 1, 1.5, 2] as PlaybackSpeed[]).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Zona Centro: Selector de capa */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-750 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('auto')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              viewMode === 'auto'
                ? 'bg-slate-700 text-amber-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Transición automática mapa a satélite"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Auto (Transición)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              viewMode === 'map'
                ? 'bg-slate-700 text-blue-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mantener capa de Google Maps"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('satellite')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              viewMode === 'satellite'
                ? 'bg-slate-700 text-emerald-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mantener fotografía satelital de Google Earth"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satélite</span>
          </button>
        </div>

        {/* Zona Derecha: Acciones y Exportar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFieldLog}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Bitácora de Campo</span>
          </button>

          <button
            type="button"
            onClick={onExportVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-semibold transition-colors"
            title="Exportar archivo de video WebM Full HD"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Video HD</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa 16:9'}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
