// Motor de renderizado cinemático para la toma aérea tipo dron de Úcupe y Huaca El Pueblo
// Duración: 10 segundos (8-12s solicitado)
// Estilo: Grabación aérea realista, sin textos, iluminación cálida de tarde en Lambayeque

import { SATELLITE_IMAGE_PATH, HUACA_CLOSEUP_IMAGE_PATH } from './cartographyEngine';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export interface DroneCameraKeyframe {
  x: number;
  y: number;
  altitude: number; // 1.0 (cerca) a 3.0 (alto)
  pitch: number;    // inclinación en grados
  yaw: number;      // rotación horizontal
  tilt: number;     // sutil alabeo natural del dron
}

// Trayectoria cinemática continua del dron
export function getDroneFlightPath(progress: number, timeSec: number): DroneCameraKeyframe {
  const t = Math.max(0, Math.min(1, progress));

  // Micro-vibración y balanceo natural de estabilizador gimbal
  const gimbalMicroRoll = Math.sin(timeSec * 1.5) * 0.35;
  const gimbalMicroPitch = Math.cos(timeSec * 1.2) * 0.25;

  let x: number;
  let y: number;
  let altitude: number;
  let pitch: number;
  let yaw: number;

  if (t < 0.25) {
    // FASE 1: Vista aérea elevada sobre el centro poblado de Úcupe avanzando hacia adelante
    const f = t / 0.25;
    const s = smoothstep(0, 1, f);
    x = lerp(850, 870, s);
    y = lerp(260, 420, s);
    altitude = lerp(2.2, 1.95, s);
    pitch = lerp(22, 26, s);
    yaw = lerp(-2, 0, s);
  } else if (t < 0.55) {
    // FASE 2: Avance sobre la avenida principal, pasando la I.E. 11185 y saliendo hacia el sur
    const f = (t - 0.25) / 0.30;
    const s = smoothstep(0, 1, f);
    x = lerp(870, 885, s);
    y = lerp(420, 640, s);
    altitude = lerp(1.95, 1.75, s);
    pitch = lerp(26, 30, s);
    yaw = lerp(0, 2, s);
  } else if (t < 0.82) {
    // FASE 3: Acercamiento progresivo sobre el sendero del bosque seco hacia la Huaca
    const f = (t - 0.55) / 0.27;
    const s = smoothstep(0, 1, f);
    x = lerp(885, 900, s);
    y = lerp(640, 850, s);
    altitude = lerp(1.75, 1.55, s);
    pitch = lerp(30, 28, s);
    yaw = lerp(2, -1, s);
  } else {
    // FASE 4: Elevación final (pull-up) para mostrar la Huaca y su relación territorial con Úcupe
    const f = (t - 0.82) / 0.18;
    const s = smoothstep(0, 1, f);
    x = lerp(900, 905, s);
    y = lerp(850, 880, s);
    altitude = lerp(1.55, 2.05, s); // Elevación gradual de cámara
    pitch = lerp(28, 20, s);        // Horizonte más visible hacia el norte
    yaw = lerp(-1, 0, s);
  }

  return {
    x,
    y,
    altitude,
    pitch: pitch + gimbalMicroPitch,
    yaw,
    tilt: gimbalMicroRoll,
  };
}

// Renderizado de la toma aérea tipo dron
export function renderDroneShot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  satelliteImg: HTMLImageElement | null,
  huacaCloseupImg: HTMLImageElement | null,
  timeSec: number
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const keyframe = getDroneFlightPath(progress, timeSec);

  // Matriz de proyección tipo dron:
  // Centro en la pantalla
  ctx.translate(width / 2, height / 2);

  // Sutil alabeo natural
  ctx.rotate((keyframe.tilt * Math.PI) / 180);

  // Escala / zoom derivado de la altitud
  const zoom = keyframe.altitude;
  ctx.scale(zoom, zoom);

  // Centrado en las coordenadas geográficas del terreno
  ctx.translate(-keyframe.x, -keyframe.y);

  // 1. Textura base de alta resolución de Úcupe y su valle
  if (satelliteImg && satelliteImg.complete && satelliteImg.naturalWidth > 0) {
    ctx.drawImage(satelliteImg, 0, 0, 1920, 1080);
  } else {
    // Fallback fotorealista mientras carga la textura
    ctx.fillStyle = '#caa57b';
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // 2. Detalle de relieve de Huaca El Pueblo
  if (huacaCloseupImg && huacaCloseupImg.complete && huacaCloseupImg.naturalWidth > 0) {
    ctx.save();
    // Superponer con blend natural
    const blendAlpha = smoothstep(0.4, 0.75, progress);
    ctx.globalAlpha = blendAlpha * 0.88;
    ctx.drawImage(huacaCloseupImg, 720, 750, 360, 270);
    ctx.restore();
  }

  ctx.restore();

  // 3. Iluminación cinematográfica de tarde en Lambayeque (Golden Hour natural)
  // Luz rasante desde el oeste (sol bajando sobre el Pacífico hacia las 4:30 - 5:00 PM)
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, 'rgba(255, 214, 150, 0.12)'); // Calidez solar
  grad.addColorStop(0.5, 'rgba(245, 180, 100, 0.05)');
  grad.addColorStop(1, 'rgba(100, 70, 50, 0.18)');   // Sombras suaves vespertinas
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Calidez atmosférica del desierto costero
  ctx.fillStyle = 'rgba(215, 160, 90, 0.04)';
  ctx.fillRect(0, 0, width, height);

  // 4. Viñeta óptica sutil de lente cinematográfica de dron
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.35,
    width / 2,
    height / 2,
    width * 0.75
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(15, 10, 5, 0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
