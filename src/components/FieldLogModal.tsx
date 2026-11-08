import React, { useState } from 'react';
import { WAYPOINTS } from '../data/routeData';
import {
  X,
  MapPin,
  Compass,
  Users,
  Calendar,
  ArrowRight,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface FieldLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToWaypoint: (progress: number) => void;
  currentProgress: number;
}

export const FieldLogModal: React.FC<FieldLogModalProps> = ({
  isOpen,
  onClose,
  onJumpToWaypoint,
  currentProgress,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; label: string } | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>07 NOVIEMBRE 2026 · ÚCUPE, LAMBAYEQUE</span>
            </div>
            <h2 className="text-lg font-display font-bold text-white mt-1">
              Recorrido Real del Trabajo de Campo Universitario
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadatos de la expedición */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/20 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono">EQUIPO</div>
              <div className="font-medium">5 estudiantes</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono">MODALIDAD</div>
              <div className="font-medium font-mono-num">1,480 m exclusivamente a pie</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono">DESTINO FINAL</div>
              <div className="font-medium">Huaca El Pueblo Úcupe</div>
            </div>
          </div>
        </div>

        {/* Lista de paradas */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Orden cronológico y geográfico obligatorio verificado con las capturas de Google Maps y Google Earth proporcionadas por el equipo de investigación:
          </p>

          <div className="space-y-3">
            {WAYPOINTS.map((wp) => {
              const isActive = Math.abs(currentProgress - wp.targetProgress) < 0.065;
              return (
                <div
                  key={wp.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-400/10 border-amber-400/40'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          wp.id === 6
                            ? 'bg-amber-500 text-slate-950'
                            : wp.waypointType === 'transit'
                            ? 'bg-purple-600 text-white'
                            : wp.id === 1
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {wp.numberLabel}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{wp.title}</h3>
                          {wp.waypointType === 'transit' && (
                            <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.5 rounded">
                              Punto de paso
                            </span>
                          )}
                          <span className="text-[11px] font-mono-num text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {wp.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{wp.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-num text-slate-400 mt-2">
                          <span>{wp.realCoords.lat}° S, {wp.realCoords.lng}° W</span>
                          <span>·</span>
                          <span>{wp.distanceFromStartMeters} m acumulados</span>
                          {wp.googleMapsUrl && (
                            <a
                              href={wp.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 underline ml-1"
                            >
                              <span>Abrir en Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToWaypoint(wp.targetProgress);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-lg transition-colors"
                      >
                        <span>Ver en mapa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {wp.referencePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({ url: wp.referencePhotoUrl!, label: wp.referencePhotoLabel || wp.title })}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Ver captura real de campo"
                        >
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          <span>Foto ref.</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contexto Arqueológico */}
          <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs space-y-2 text-amber-200/90">
            <h4 className="font-semibold text-amber-300">
              Huaca El Pueblo Úcupe (Destino Final)
            </h4>
            <p className="leading-relaxed">
              Complejo ceremonial monumental en adobe edificado por la cultura Mochica, célebre por la tumba del Señor de Úcupe y sus pinturas murales. El equipo culminó su reconocimiento en la plataforma monumental conectada con el centro poblado mediante el sendero pedestre a través del bosque seco.
            </p>
          </div>
        </div>

        {/* Modal de foto de referencia */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 z-60 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-slate-800 text-xs font-semibold text-white">
                <span>{selectedPhoto.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.label}
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
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
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
};
