import {
  Waypoint,
  CameraFrame,
  ViewMode,
  MapPoint,
} from '../types/cartography';
import {
  WAYPOINTS,
  DENSE_PATH,
  MAP_LANDMARKS,
  VECTOR_ROADS,
} from '../data/routeData';

export const SATELLITE_IMAGE_PATH = '/src/assets/images/satellite_ucupe_orthophoto_1794177028835.jpg';
export const HUACA_CLOSEUP_IMAGE_PATH = '/src/assets/images/satellite_huaca_close_up_1794177028275.jpg';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Obtener punto actual, dirección y waypoints activos
export function getPathInterpolation(progress: number): {
  point: MapPoint;
  heading: number;
  currentDistanceMeters: number;
  activeWaypoint: Waypoint | null;
  passedWaypoints: Waypoint[];
} {
  const clamped = Math.max(0, Math.min(1, progress));

  let idx = 0;
  for (let i = 0; i < DENSE_PATH.length - 1; i++) {
    if (clamped >= DENSE_PATH[i].t && clamped <= DENSE_PATH[i + 1].t) {
      idx = i;
      break;
    }
  }

  const p1 = DENSE_PATH[idx];
  const p2 = DENSE_PATH[idx + 1] || p1;
  const segDuration = Math.max(0.0001, p2.t - p1.t);
  const segT = Math.max(0, Math.min(1, (clamped - p1.t) / segDuration));

  const curX = lerp(p1.x, p2.x, segT);
  const curY = lerp(p1.y, p2.y, segT);
  const heading = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  const totalDist = 1480;
  const currentDistanceMeters = Math.round(clamped * totalDist);

  let activeWaypoint: Waypoint | null = null;
  const passedWaypoints: Waypoint[] = [];

  for (const wp of WAYPOINTS) {
    if (clamped >= wp.targetProgress) {
      passedWaypoints.push(wp);
    }
    const distToWp = Math.abs(clamped - wp.targetProgress);
    if (distToWp < 0.065) {
      activeWaypoint = wp;
    }
  }

  return {
    point: { x: curX, y: curY },
    heading,
    currentDistanceMeters,
    activeWaypoint,
    passedWaypoints,
  };
}

// Cálculo de cámara dinámico que acompaña los movimientos reales
export function getCameraFrame(progress: number, viewMode: ViewMode): CameraFrame {
  const { point } = getPathInterpolation(progress);

  let targetX = point.x;
  let targetY = point.y;
  let zoom = 1.9;
  let satelliteAlpha = 0;

  if (progress < 0.10) {
    // Vista general aérea inicial y acercamiento progresivo hacia el Restaurante
    const t = progress / 0.10;
    const startX = 850;
    const startY = 480;
    targetX = lerp(startX, point.x, smoothstep(0, 1, t));
    targetY = lerp(startY, point.y, smoothstep(0, 1, t));
    zoom = lerp(1.25, 2.1, smoothstep(0, 1, t));
    satelliteAlpha = 0;
  } else if (progress < 0.45) {
    // Sector urbano: Restaurante a Parque Úcupe
    zoom = 2.15;
    satelliteAlpha = 0;
  } else if (progress < 0.70) {
    // Retorno por la avenida: Parque a Mercado y Cooperativa
    zoom = 2.05;
    satelliteAlpha = 0;
  } else if (progress < 0.85) {
    // Descenso hacia el colegio I.E. 11185 y salida del casco urbano
    // La transición a vista satelital ocurre progresivamente aquí
    const t = (progress - 0.70) / 0.15;
    zoom = lerp(2.05, 1.75, smoothstep(0, 1, t));
    satelliteAlpha = smoothstep(0, 1, t);
  } else {
    // Acercamiento satelital final hacia la Huaca El Pueblo
    const t = (progress - 0.85) / 0.15;
    const huacaX = 900;
    const huacaY = 920;
    targetX = lerp(point.x, huacaX, smoothstep(0, 1, t));
    targetY = lerp(point.y, huacaY, smoothstep(0, 1, t));
    zoom = lerp(1.75, 1.95, smoothstep(0, 1, t));
    satelliteAlpha = 1.0;
  }

  if (viewMode === 'map') {
    satelliteAlpha = 0;
  } else if (viewMode === 'satellite') {
    satelliteAlpha = 1;
  }

  return {
    centerX: targetX,
    centerY: targetY,
    zoom,
    satelliteAlpha,
    bearing: 0,
    pitch: 0,
  };
}

// Renderizado cartográfico 2D
export function renderCartography(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  viewMode: ViewMode,
  satelliteImg: HTMLImageElement | null,
  huacaCloseupImg: HTMLImageElement | null,
  pulseTime: number,
  showHud: boolean = true
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const camera = getCameraFrame(progress, viewMode);
  const { point: walkerPos, passedWaypoints, activeWaypoint, currentDistanceMeters } = getPathInterpolation(progress);

  // Transformación de cámara
  ctx.translate(width / 2, height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.centerX, -camera.centerY);

  // 1. CAPA VECTORIAL GOOGLE MAPS
  drawVectorMapLayer(ctx);

  // 2. CAPA SATELITAL GOOGLE EARTH (con blend progresivo)
  if (camera.satelliteAlpha > 0.01 && satelliteImg && satelliteImg.complete && satelliteImg.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = camera.satelliteAlpha;
    // Imagen satelital orientada con la geografía de Úcupe
    ctx.drawImage(satelliteImg, 0, 0, 1920, 1080);

    // Detalle de la Huaca cuando la cámara llega al destino arqueológico
    if (progress > 0.82 && huacaCloseupImg && huacaCloseupImg.complete && huacaCloseupImg.naturalWidth > 0) {
      const huacaAlpha = smoothstep(0.82, 0.95, progress) * camera.satelliteAlpha;
      ctx.globalAlpha = huacaAlpha;
      ctx.drawImage(huacaCloseupImg, 720, 750, 360, 270);
    }
    ctx.restore();
  }

  // 3. RUTA PEATONAL AMARILLA (Google Maps Walking Path)
  drawWalkingRoute(ctx, progress, pulseTime);

  // 4. WAYPOINTS Y GLOBOS INFORMATIVOS
  drawWaypoints(ctx, passedWaypoints, activeWaypoint, progress);

  // 5. BALIZA DE LOS 5 ESTUDIANTES (Punto azul Google Maps)
  drawWalkerBeacon(ctx, walkerPos, pulseTime, camera.satelliteAlpha > 0.5);

  ctx.restore();

  // 6. HUD DE GOOGLE MAPS
  if (showHud) {
    drawGoogleMapsHud(
      ctx,
      width,
      height,
      camera,
      currentDistanceMeters,
      activeWaypoint,
      progress
    );
  }
}

function drawVectorMapLayer(ctx: CanvasRenderingContext2D): void {
  // Fondo cartográfico crema Google Maps
  ctx.fillStyle = '#f4f3ef';
  ctx.fillRect(-500, -500, 3000, 2000);

  // Campos agrícolas circundantes
  ctx.fillStyle = '#e8f0df';
  ctx.fillRect(-200, -100, 750, 1200);

  // Bosque seco / algarrobal al sur hacia la Huaca
  ctx.fillStyle = '#ebede4';
  ctx.fillRect(600, 640, 700, 440);

  // Manzanas urbanas construidas de Úcupe
  ctx.fillStyle = '#ebe7e0';
  ctx.strokeStyle = '#dbd6cb';
  ctx.lineWidth = 1.5;

  const blocks = [
    // Manzanas norte (alrededor de la calle al restaurante)
    { x: 740, y: 220, w: 120, h: 180 },
    { x: 890, y: 220, w: 120, h: 180 },
    { x: 1020, y: 220, w: 140, h: 180 },
    // Manzanas sur (entre la avenida y la I.E. 11185)
    { x: 740, y: 460, w: 100, h: 140 },
    { x: 860, y: 460, w: 120, h: 90 },
    { x: 1000, y: 480, w: 140, h: 120 },
  ];

  for (const b of blocks) {
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Parque de Úcupe (área verde central)
  ctx.fillStyle = '#cde7c5';
  ctx.strokeStyle = '#a6d89b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1030, 445, 80, 60, 8);
  ctx.fill();
  ctx.stroke();

  // Arbolitos del parque
  ctx.fillStyle = '#8fbe81';
  ctx.beginPath();
  ctx.arc(1050, 465, 6, 0, Math.PI * 2);
  ctx.arc(1090, 465, 6, 0, Math.PI * 2);
  ctx.arc(1070, 485, 7, 0, Math.PI * 2);
  ctx.fill();

  // Complejo Deportivo Úcupe
  ctx.fillStyle = '#dbe7f2';
  ctx.strokeStyle = '#adc6de';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(900, 360, 70, 45, 4);
  ctx.fill();
  ctx.stroke();

  // I.E. 11185 Úcupe (colegio)
  ctx.fillStyle = '#e5dbd0';
  ctx.strokeStyle = '#c5b5a2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(830, 560, 60, 45, 4);
  ctx.fill();
  ctx.stroke();

  // Plataforma monumental de la Huaca El Pueblo
  ctx.fillStyle = '#decbb3';
  ctx.strokeStyle = '#ba9e7d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(820, 850, 160, 140, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cca97e';
  ctx.beginPath();
  ctx.roundRect(850, 880, 100, 80, 8);
  ctx.fill();
  ctx.stroke();

  // Calles de Úcupe
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Casing de las vías
  ctx.strokeStyle = '#dad4c9';
  for (const road of VECTOR_ROADS) {
    ctx.lineWidth = road.isMain ? 24 : 16;
    ctx.beginPath();
    road.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }

  // Relleno blanco de las vías
  ctx.strokeStyle = '#ffffff';
  for (const road of VECTOR_ROADS) {
    ctx.lineWidth = road.isMain ? 20 : 12;
    ctx.beginPath();
    road.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }

  // Rótulos de lugares de referencia identificados en las fotos del usuario
  for (const lm of MAP_LANDMARKS) {
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#495057';
    ctx.textAlign = 'center';
    ctx.fillText(lm.name, lm.x, lm.y - 4);
  }

  ctx.restore();
}

function drawWalkingRoute(ctx: CanvasRenderingContext2D, progress: number, pulseTime: number): void {
  ctx.save();

  // Trazado planificado en punteado sutil
  ctx.strokeStyle = 'rgba(251, 188, 4, 0.35)';
  ctx.lineWidth = 5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  DENSE_PATH.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Trazado recorrido en línea amarilla Google Maps
  if (progress > 0.001) {
    const activeNodes: MapPoint[] = [];
    for (const node of DENSE_PATH) {
      if (node.t <= progress) {
        activeNodes.push(node);
      } else {
        break;
      }
    }

    const { point: currentPt } = getPathInterpolation(progress);
    activeNodes.push(currentPt);

    if (activeNodes.length >= 2) {
      // Casing blanco exterior
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      activeNodes.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Línea amarilla canónica de Google Maps (#FBBC04)
      ctx.strokeStyle = '#f4b400';
      ctx.lineWidth = 6;
      ctx.beginPath();
      activeNodes.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Puntos peatonales interiores sincronizados
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
      const dashOffset = (pulseTime * 20) % 12;
      ctx.lineDashOffset = -dashOffset;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      activeNodes.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawWaypoints(
  ctx: CanvasRenderingContext2D,
  passedWaypoints: Waypoint[],
  activeWaypoint: Waypoint | null,
  progress: number
): void {
  ctx.save();

  for (const wp of WAYPOINTS) {
    const isPassed = wp.targetProgress <= progress;
    const isCurrent = activeWaypoint?.id === wp.id;

    // Sombra del pin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(wp.point.x, wp.point.y + 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    let pinColor = '#ea4335'; // Rojo Google estándar
    if (wp.id === 1) pinColor = '#ea4335'; // Restaurante
    if (wp.id === 2) pinColor = '#34a853'; // Parque Úcupe
    if (wp.id === 3) pinColor = '#fbbc04'; // Mercado
    if (wp.id === 4) pinColor = '#4285f4'; // Cooperativa Agraria
    if (wp.id === 5) pinColor = '#9333ea'; // I.E. 11185 (Colegio - Punto de paso)
    if (wp.id === 6) pinColor = '#b45309'; // Huaca El Pueblo Úcupe

    if (!isPassed && !isCurrent) {
      pinColor = '#9aa0a6';
    }

    // Dibujar Pin
    drawGooglePin(
      ctx,
      wp.point.x,
      wp.point.y,
      pinColor,
      wp.numberLabel,
      isCurrent,
      wp.waypointType === 'transit'
    );

    // Globo informativo al alcanzar el hito
    if (isCurrent && isPassed) {
      drawWaypointCallout(ctx, wp);
    }
  }

  ctx.restore();
}

function drawGooglePin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  isHighlighted: boolean,
  isTransit: boolean
): void {
  ctx.save();
  const scale = isHighlighted ? 1.25 : 1.0;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (isTransit) {
    // Pin de punto de paso (diamante/circular discreto para I.E. 11185)
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '700 6.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 0, -12);
  } else {
    // Pin estándar Google Maps con punta hacia la calle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-1.5, -4, -8, -14, -8, -20);
    ctx.arc(0, -20, 8, Math.PI, 0, false);
    ctx.bezierCurveTo(8, -14, 1.5, -4, 0, 0);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -20, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.font = '700 6.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -19.7);
  }

  ctx.restore();
}

function drawWaypointCallout(ctx: CanvasRenderingContext2D, wp: Waypoint): void {
  ctx.save();
  const x = wp.point.x;
  const y = wp.point.y - 32;

  const cardWidth = 230;
  const cardHeight = 64;
  const cardX = x - cardWidth / 2;
  const cardY = y - cardHeight;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(x - 6, cardY + cardHeight);
  ctx.lineTo(x, cardY + cardHeight + 6);
  ctx.lineTo(x + 6, cardY + cardHeight);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Barra de color lateral
  ctx.fillStyle = wp.id === 6 ? '#b45309' : wp.waypointType === 'transit' ? '#9333ea' : '#1a73e8';
  ctx.fillRect(cardX + 10, cardY + 12, 4, 38);

  // Título
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#202124';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(wp.title, cardX + 22, cardY + 11);

  // Subtítulo
  ctx.font = '500 9.5px "DM Sans", sans-serif';
  ctx.fillStyle = '#5f6368';
  ctx.fillText(wp.subtitle, cardX + 22, cardY + 27);

  // Metadatos
  ctx.font = '600 8.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#1a73e8';
  ctx.fillText(`${wp.time} · ${wp.distanceFromStartMeters} m a pie`, cardX + 22, cardY + 43);

  ctx.restore();
}

function drawWalkerBeacon(
  ctx: CanvasRenderingContext2D,
  pos: MapPoint,
  pulseTime: number,
  isSatellite: boolean
): void {
  ctx.save();
  const x = pos.x;
  const y = pos.y;

  const pulseRadius = 12 + (Math.sin(pulseTime * 4) + 1) * 6;
  ctx.fillStyle = 'rgba(26, 115, 232, 0.2)';
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a73e8';
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Etiqueta del equipo de 5 estudiantes
  ctx.fillStyle = isSatellite ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = isSatellite ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 55, y - 24, 110, 16, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isSatellite ? '#f8fafc' : '#202124';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Equipo universitario (5)', x, y - 16);

  ctx.restore();
}

function drawGoogleMapsHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: CameraFrame,
  currentDistanceMeters: number,
  activeWaypoint: Waypoint | null,
  progress: number
): void {
  ctx.save();

  // 1. Barra de búsqueda de Google Maps
  const searchX = 24;
  const searchY = 24;
  const searchW = 420;
  const searchH = 48;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(searchX, searchY, searchW, searchH, 8);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Menú hamburguesa
  ctx.strokeStyle = '#5f6368';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(searchX + 18, searchY + 18 + i * 6);
    ctx.lineTo(searchX + 32, searchY + 18 + i * 6);
    ctx.stroke();
  }

  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#202124';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Úcupe, Lambayeque · Recorrido de Campo', searchX + 46, searchY + 24);

  // Icono caminar
  ctx.fillStyle = '#1a73e8';
  ctx.beginPath();
  ctx.arc(searchX + searchW - 24, searchY + 24, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚶', searchX + searchW - 24, searchY + 24);

  // Fecha académica
  ctx.fillStyle = 'rgba(32, 33, 36, 0.88)';
  ctx.beginPath();
  ctx.roundRect(searchX, searchY + searchH + 8, 310, 26, 6);
  ctx.fill();

  ctx.font = '600 10px "DM Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRABAJO DE CAMPO · 07 NOVIEMBRE 2026', searchX + 12, searchY + searchH + 21);

  // Brújula
  const compassX = width - 48;
  const compassY = 48;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(compassX, compassY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ea4335';
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - 14);
  ctx.lineTo(compassX + 5, compassY);
  ctx.lineTo(compassX - 5, compassY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#bdc1c6';
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + 14);
  ctx.lineTo(compassX + 5, compassY);
  ctx.lineTo(compassX - 5, compassY);
  ctx.closePath();
  ctx.fill();

  ctx.font = '700 8px sans-serif';
  ctx.fillStyle = '#ea4335';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('N', compassX, compassY - 15);

  // Selector de Capa
  const isSatelliteMode = camera.satelliteAlpha > 0.5;
  const layerX = 24;
  const layerY = height - 60;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(layerX, layerY, 130, 36, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = isSatelliteMode ? '#1a73e8' : '#3c4043';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(isSatelliteMode ? '🛰️ Google Earth' : '🗺️ Google Maps', layerX + 12, layerY + 18);

  // Escala métrica y coordenadas reales
  const scaleX = width - 180;
  const scaleY = height - 44;
  const scalePixels = 60;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.roundRect(scaleX - 10, scaleY - 26, 170, 38, 4);
  ctx.fill();

  ctx.strokeStyle = '#202124';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(scaleX, scaleY - 6);
  ctx.lineTo(scaleX, scaleY);
  ctx.lineTo(scaleX + scalePixels, scaleY);
  ctx.lineTo(scaleX + scalePixels, scaleY - 6);
  ctx.stroke();

  ctx.font = '600 9px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#202124';
  ctx.textAlign = 'center';
  ctx.fillText('100 m', scaleX + scalePixels / 2, scaleY - 10);

  const curLat = lerp(-7.0302, -7.0382, progress).toFixed(4);
  const curLng = lerp(-79.6279, -79.6268, progress).toFixed(4);
  ctx.font = '500 8.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#5f6368';
  ctx.textAlign = 'left';
  ctx.fillText(`${curLat}° S, ${curLng}° W`, scaleX - 6, scaleY + 10);

  // Telemetría acumulada
  const distBadgeX = 164;
  const distBadgeY = height - 60;
  ctx.fillStyle = 'rgba(32, 33, 36, 0.88)';
  ctx.beginPath();
  ctx.roundRect(distBadgeX, distBadgeY, 210, 36, 6);
  ctx.fill();

  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#fbbc04';
  ctx.textAlign = 'left';
  ctx.fillText(`CAMINATA: ${currentDistanceMeters} m`, distBadgeX + 12, distBadgeY + 14);

  ctx.font = '500 9px "DM Sans", sans-serif';
  ctx.fillStyle = '#dcdcdc';
  ctx.fillText(activeWaypoint ? activeWaypoint.title : 'En desplazamiento a pie', distBadgeX + 12, distBadgeY + 27);

  ctx.restore();
}
