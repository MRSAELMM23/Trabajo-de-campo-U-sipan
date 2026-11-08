import { useState, useRef, useEffect, useCallback } from 'react';
import { ViewMode, PlaybackSpeed, Waypoint } from './types/cartography';
import { CartographicPlayer } from './components/CartographicPlayer';
import { PlaybackControls } from './components/PlaybackControls';
import { VideoExporterModal } from './components/VideoExporterModal';
import { FieldLogModal } from './components/FieldLogModal';
import { WAYPOINTS } from './data/routeData';
import {
  Download,
  Calendar,
  Footprints,
  Compass,
  MapPin,
  ChevronRight,
  Info,
  HardDrive,
} from 'lucide-react';
import { User } from 'firebase/auth';

import { DronePlayer } from './components/DronePlayer';
import { GoogleDriveModal } from './components/GoogleDriveModal';

export default function App() {
  const [appMode, setAppMode] = useState<'drone' | 'map'>('drone');
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  const [isFieldLogOpen, setIsFieldLogOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(WAYPOINTS[0]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const totalDurationSeconds = 18;

  // Manejo de atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setProgress((prev) => Math.min(1, prev + 0.05));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setProgress((prev) => Math.max(0, prev - 0.05));
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        setProgress(0);
        setIsPlaying(true);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleWaypointReached = (wp: Waypoint) => {
    setActiveWaypoint(wp);
  };

  const jumpToWaypoint = (targetProgress: number) => {
    setProgress(targetProgress);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Header con contrato Top Bar de 3 zonas */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#0d131f]/95 backdrop-blur-md sticky top-0 z-40">
        {/* Zona 1: Título de marca */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            Ú
          </div>
          <span className="text-base font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Úcupe · Trabajo de Campo 2026
          </span>
        </div>

        {/* Zona 2: Selector de Modo (Dron / Cartografía) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setAppMode('drone')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              appMode === 'drone'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚁 Toma Aérea Dron (16:9)
          </button>
          <button
            type="button"
            onClick={() => setAppMode('map')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              appMode === 'map'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ Navegación Cartográfica
          </button>
        </div>

        {/* Zona 3: Acción primaria y Google Drive */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Conectar y explorar Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentUser ? currentUser.displayName?.split(' ')[0] || 'Drive Conectado' : 'Google Drive'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (appMode === 'drone') {
                setIsFieldLogOpen(true);
              } else {
                setIsExporterOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-md whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{appMode === 'drone' ? 'Bitácora de Campo' : 'Exportar Video HD'}</span>
          </button>
        </div>
      </header>

      {/* 2. Escenario Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Banner de contexto académico */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl px-5 py-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>7 de noviembre de 2026</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Centro Poblado Úcupe a Huaca El Pueblo (Lambayeque, Perú)</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Footprints className="w-4 h-4 text-amber-400" />
              <span>Trabajo de campo universitario (5 estudiantes)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFieldLogOpen(true)}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium hover:underline"
          >
            <span>Ver bitácora y coordenadas de campo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MODO 1: TOMA AÉREA TIPO DRON (LIMPIA, SIN TEXTOS SOBRE LA IMAGEN) */}
        {appMode === 'drone' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  TOMA AÉREA TIPO DRON
                </span>
                <span>Metraje cinematográfico continuo (10s) · Iluminación de tarde en Lambayeque · Sin textos en imagen</span>
              </div>
              <button
                type="button"
                onClick={() => setAppMode('map')}
                className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
              >
                Cambiar a animación con ruta y paradas →
              </button>
            </div>

            <DronePlayer
              onSwitchToMapMode={() => setAppMode('map')}
              onOpenDriveModal={() => setIsDriveModalOpen(true)}
            />
          </div>
        ) : (
          /* MODO 2: REPRODUCTOR CARTOGRÁFICO CON RUTA PEATONAL */
          <div
            ref={playerContainerRef}
            className={`flex flex-col gap-4 ${
              isFullscreen ? 'fixed inset-0 z-50 bg-black p-4 justify-center items-center' : ''
            }`}
          >
            <div className={isFullscreen ? 'w-full max-w-6xl aspect-video' : 'w-full'}>
              <CartographicPlayer
                progress={progress}
                setProgress={setProgress}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                viewMode={viewMode}
                totalDurationSeconds={totalDurationSeconds}
                canvasRef={canvasRef}
                onWaypointReached={handleWaypointReached}
                onFinished={() => setIsPlaying(false)}
              />
            </div>

            {/* Deck de Controles */}
            <div className={isFullscreen ? 'w-full max-w-6xl' : 'w-full'}>
              <PlaybackControls
                progress={progress}
                setProgress={setProgress}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                viewMode={viewMode}
                setViewMode={setViewMode}
                totalDurationSeconds={totalDurationSeconds}
                onOpenFieldLog={() => setIsFieldLogOpen(true)}
                onExportVideo={() => setIsExporterOpen(true)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </div>
          </div>
        )}

        {/* 3. Panel de Información de la Parada Actual y Bitácora Cronológica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de la parada actual */}
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  HITO EN PANTALLA
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono-num bg-slate-800 text-slate-300">
                  {activeWaypoint?.time}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  {activeWaypoint?.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {activeWaypoint?.subtitle}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                {activeWaypoint?.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-num text-slate-400">
              <span>Coordenadas:</span>
              <span className="text-slate-200">
                {activeWaypoint?.realCoords.lat}° S, {activeWaypoint?.realCoords.lng}° W
              </span>
            </div>
          </div>

          {/* Tira cronológica de las 6 paradas */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Cronología Peatonal (Úcupe a Huaca El Pueblo)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono-num">
                1,480 metros acumulados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {WAYPOINTS.map((wp) => {
                const isSelected = activeWaypoint?.id === wp.id;
                const isPassed = progress >= wp.targetProgress;

                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => jumpToWaypoint(wp.targetProgress)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400/50 shadow-md'
                        : isPassed
                        ? 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          wp.id === 6
                            ? 'bg-amber-400 text-slate-950'
                            : isPassed
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {wp.numberLabel}
                      </span>
                      <span className="text-[10px] font-mono-num text-slate-400">
                        {wp.distanceFromStartMeters} m
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-white truncate">
                      {wp.title.split(':')[1]?.trim() || wp.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {wp.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nota de fidelidad cartográfica */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Animación desarrollada con fidelidad geográfica y visual según la cartografía vectorial oficial de Google Maps y fotografía satelital de Google Earth. Desplazamiento verificado a pie sin alteración de las construcciones, calles ni del complejo arqueológico de Huaca El Pueblo.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      <VideoExporterModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        viewMode={viewMode}
        totalDurationSeconds={totalDurationSeconds}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      <FieldLogModal
        isOpen={isFieldLogOpen}
        onClose={() => setIsFieldLogOpen(false)}
        onJumpToWaypoint={jumpToWaypoint}
        currentProgress={progress}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
      />
    </div>
  );
}
