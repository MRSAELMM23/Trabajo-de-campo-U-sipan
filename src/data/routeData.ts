import { Waypoint, PathNode } from '../types/cartography';

// RECORRIDO REAL Y EXACTO DEL TRABAJO DE CAMPO (07 DE NOVIEMBRE DE 2026)
// Basado en las capturas georreferenciadas y enlaces oficiales de Google Maps:
// 1. Restaurante -> 2. Parque Úcupe -> 3. Mercado de Úcupe -> 4. Antigua Cooperativa Agraria -> 5. I.E. 11185 (paso) -> 6. Huaca El Pueblo

export const WAYPOINTS: Waypoint[] = [
  {
    id: 1,
    numberLabel: '1',
    title: 'Punto 1: Restaurante (Almuerzo)',
    subtitle: 'Primer lugar visitado tras la llegada a Úcupe',
    time: '12:00 PM · 07/11/2026',
    category: 'restaurante',
    waypointType: 'stop',
    description: 'Ubicación exacta visitada por los 5 estudiantes para almorzar antes de iniciar el reconocimiento pedestre. Se accede subiendo por la calle norte frente a la Capilla y el Complejo Deportivo.',
    targetProgress: 0.16,
    point: { x: 885, y: 250 },
    realCoords: { lat: -7.0302, lng: -79.6279 },
    altitudeMeters: 28,
    distanceFromStartMeters: 280,
    googleMapsUrl: 'https://maps.app.goo.gl/Dh2w5getXxFN7ncX8',
    referencePhotoUrl: '/public/assets/aistudio/image_8f0b11f6.png',
    referencePhotoLabel: 'Foto 1: Camino al restaurante',
  },
  {
    id: 2,
    numberLabel: '2',
    title: 'Punto 2: Parque de Úcupe',
    subtitle: 'Espacio público central y eje cívico',
    time: '01:05 PM · 07/11/2026',
    category: 'parque',
    waypointType: 'stop',
    description: 'Desplazamiento a pie desde el restaurante bajando por la calle norte y doblando hacia el sureste por la avenida principal hasta llegar al Parque Úcupe (frente a Negritos Chiclayano).',
    targetProgress: 0.38,
    point: { x: 1070, y: 475 },
    realCoords: { lat: -7.0318, lng: -79.6256 },
    altitudeMeters: 29,
    distanceFromStartMeters: 560,
    googleMapsUrl: 'https://maps.app.goo.gl/aAT62jX2oxFu35Ra7?g_st=ac',
    referencePhotoUrl: '/public/assets/aistudio/image_eaeaf255.png',
    referencePhotoLabel: 'Foto 2: Del restaurante al parque',
  },
  {
    id: 3,
    numberLabel: '3',
    title: 'Punto 3: Mercado de Úcupe',
    subtitle: 'Comercio tradicional en la avenida principal',
    time: '01:35 PM · 07/11/2026',
    category: 'mercado',
    waypointType: 'stop',
    description: 'Continuación peatonal desde el parque hacia el oeste por la acera sur de la avenida principal, frente a la Capilla de Úcupe.',
    targetProgress: 0.52,
    point: { x: 920, y: 445 },
    realCoords: { lat: -7.0315, lng: -79.6272 },
    altitudeMeters: 29,
    distanceFromStartMeters: 740,
    googleMapsUrl: 'https://maps.app.goo.gl/aAT62jX2oxFu35Ra7?g_st=ac',
    referencePhotoUrl: '/public/assets/aistudio/image_4a9343e0.png',
    referencePhotoLabel: 'Foto 3: Del parque al mercado de Úcupe',
  },
  {
    id: 4,
    numberLabel: '4',
    title: 'Punto 4: Antigua Cooperativa Agraria Úcupe',
    subtitle: 'Sede histórica en la curva oeste del poblado',
    time: '02:00 PM · 07/11/2026',
    category: 'cooperativa',
    waypointType: 'stop',
    description: 'Recorrido a pie continuando hacia el oeste por la avenida principal hasta la sede histórica de la Cooperativa Agraria Úcupe.',
    targetProgress: 0.66,
    point: { x: 740, y: 440 },
    realCoords: { lat: -7.0312, lng: -79.6291 },
    altitudeMeters: 28,
    distanceFromStartMeters: 940,
    googleMapsUrl: 'https://maps.app.goo.gl/gcXa3wRcNKvhqCi39?g_st=ac',
    referencePhotoUrl: '/public/assets/aistudio/image_5f126db9.png',
    referencePhotoLabel: 'Foto 4: Del mercado a la cooperativa de Úcupe',
  },
  {
    id: 5,
    numberLabel: '5',
    title: 'Punto 5: I.E. 11185 Úcupe (Punto de Paso)',
    subtitle: 'Paso por el colegio hacia la zona arqueológica',
    time: '02:20 PM · 07/11/2026',
    category: 'colegio',
    waypointType: 'transit',
    description: 'Punto de paso obligatorio. El equipo desciende hacia el sur pasando junto a la I.E. 11185 y la Posta Médica EsSalud para tomar el sendero que sale del casco urbano.',
    targetProgress: 0.78,
    point: { x: 855, y: 580 },
    realCoords: { lat: -7.0336, lng: -79.6278 },
    altitudeMeters: 29,
    distanceFromStartMeters: 1120,
    googleMapsUrl: 'https://maps.app.goo.gl/kHCVzsFgxFGHNnZy7?g_st=ac',
    referencePhotoLabel: 'Paso por la I.E. 11185 Úcupe',
  },
  {
    id: 6,
    numberLabel: '6',
    title: 'Destino Final: Huaca El Pueblo Úcupe',
    subtitle: 'Plataforma monumental arqueológica Mochica',
    time: '02:50 PM · 07/11/2026',
    category: 'arqueologia',
    waypointType: 'stop',
    description: 'Destino final del trabajo de campo. El equipo sigue el sendero natural que cruza el bosque seco hacia el sur, rematando sobre la monumental plataforma de adobe de la Huaca El Pueblo.',
    targetProgress: 1.0,
    point: { x: 900, y: 920 },
    realCoords: { lat: -7.0382, lng: -79.6268 },
    altitudeMeters: 33,
    distanceFromStartMeters: 1480,
    referencePhotoUrl: '/public/assets/aistudio/image_806ce958.png',
    referencePhotoLabel: 'Foto 6: Del colegio a la Huaca El Pueblo Úcupe',
  },
];

// Nodos densos de trayectoria peatonal siguiendo fielmente las calles y senderos reales
export const DENSE_PATH: PathNode[] = [
  // 1. Llegada desde el oeste hacia la Capilla y subida al restaurante (Foto 1)
  { x: 640, y: 430, t: 0.00 },
  { x: 710, y: 433, t: 0.03 },
  { x: 780, y: 435, t: 0.06 },
  { x: 840, y: 436, t: 0.09 },
  // Giro hacia el norte en la calle entre Capilla y Complejo Deportivo
  { x: 870, y: 435, t: 0.11 },
  { x: 874, y: 380, t: 0.125 },
  { x: 878, y: 320, t: 0.14 },
  { x: 885, y: 250, t: 0.16 }, // PUNTO 1: RESTAURANTE

  // 2. Del Restaurante al Parque Úcupe (Foto 2)
  // Regreso hacia el sur por la misma calle
  { x: 885, y: 250, t: 0.19 }, // Pausa documental en restaurante
  { x: 878, y: 320, t: 0.22 },
  { x: 874, y: 380, t: 0.25 },
  { x: 870, y: 435, t: 0.28 },
  // Giro al este / sureste por la avenida principal
  { x: 915, y: 442, t: 0.30 },
  { x: 965, y: 452, t: 0.32 },
  { x: 1015, y: 464, t: 0.35 },
  { x: 1070, y: 475, t: 0.38 }, // PUNTO 2: PARQUE ÚCUPE

  // 3. Del Parque al Mercado de Úcupe (Foto 3)
  { x: 1070, y: 475, t: 0.41 }, // Pausa en parque
  // Retorno hacia el oeste por la acera sur de la avenida
  { x: 1025, y: 466, t: 0.44 },
  { x: 975, y: 454, t: 0.48 },
  { x: 920, y: 445, t: 0.52 }, // PUNTO 3: MERCADO DE ÚCUPE

  // 4. Del Mercado a la Cooperativa Agraria Úcupe (Foto 4)
  { x: 920, y: 445, t: 0.55 }, // Pausa en mercado
  // Continuación hacia el oeste por la avenida
  { x: 865, y: 438, t: 0.58 },
  { x: 805, y: 437, t: 0.62 },
  { x: 740, y: 440, t: 0.66 }, // PUNTO 4: ANTIGUA COOPERATIVA AGRARIA

  // 5. De la Cooperativa hacia la I.E. 11185 (Punto de paso)
  { x: 740, y: 440, t: 0.69 },
  // Giro hacia el sur por la calle de acceso residencial
  { x: 748, y: 475, t: 0.71 },
  { x: 780, y: 510, t: 0.73 },
  { x: 820, y: 545, t: 0.75 },
  { x: 855, y: 580, t: 0.78 }, // PUNTO 5: I.E. 11185 ÚCUPE (Punto de paso)

  // 6. Del colegio a la Huaca El Pueblo Úcupe por el sendero del bosque seco (Foto 6)
  { x: 860, y: 620, t: 0.81 },
  { x: 875, y: 660, t: 0.84 },
  { x: 895, y: 705, t: 0.87 },
  { x: 885, y: 755, t: 0.90 },
  { x: 905, y: 810, t: 0.93 },
  { x: 890, y: 865, t: 0.96 },
  { x: 900, y: 920, t: 1.00 }, // PUNTO 6: DESTINO FINAL: HUACA EL PUEBLO
];

// Elementos cartográficos vectoriales del centro poblado
export interface Landmark {
  name: string;
  x: number;
  y: number;
  type: 'culto' | 'deporte' | 'salud' | 'comercio' | 'civico' | 'educacion';
}

export const MAP_LANDMARKS: Landmark[] = [
  { name: 'Capilla De Úcupe', x: 830, y: 410, type: 'culto' },
  { name: 'Complejo Deportivo Úcupe', x: 935, y: 380, type: 'deporte' },
  { name: 'Negritos Chiclayano', x: 1070, y: 508, type: 'comercio' },
  { name: 'Posta Médica Úcupe EsSalud', x: 800, y: 610, type: 'salud' },
  { name: 'I. E. 11185 - Úcupe', x: 855, y: 580, type: 'educacion' },
  { name: 'Antigua Cooperativa Agraria', x: 740, y: 440, type: 'civico' },
  { name: 'Mercado de Úcupe', x: 920, y: 445, type: 'comercio' },
  { name: 'Parque Úcupe', x: 1070, y: 475, type: 'civico' },
];

export const VECTOR_ROADS = [
  // Avenida principal curva (eje este-oeste)
  {
    name: 'Avenida Principal Úcupe',
    isMain: true,
    points: [
      { x: 600, y: 430 },
      { x: 740, y: 440 },
      { x: 840, y: 436 },
      { x: 920, y: 445 },
      { x: 1010, y: 462 },
      { x: 1070, y: 475 },
      { x: 1200, y: 510 },
    ],
  },
  // Calle norte al Restaurante (entre Capilla y Complejo Deportivo)
  {
    name: 'Calle Norte (Acceso al Restaurante)',
    isMain: false,
    points: [
      { x: 870, y: 435 },
      { x: 875, y: 350 },
      { x: 885, y: 250 },
      { x: 890, y: 180 },
    ],
  },
  // Calle sur hacia la I.E. 11185 y Posta Médica
  {
    name: 'Calle Sur (Hacia I.E. 11185)',
    isMain: false,
    points: [
      { x: 740, y: 440 },
      { x: 750, y: 490 },
      { x: 790, y: 530 },
      { x: 855, y: 580 },
      { x: 860, y: 625 },
    ],
  },
  // Calles reticulares urbanas adicionales
  {
    name: 'Calle Transversal Norte',
    isMain: false,
    points: [
      { x: 780, y: 280 },
      { x: 1050, y: 290 },
    ],
  },
  {
    name: 'Calle Este',
    isMain: false,
    points: [
      { x: 1010, y: 320 },
      { x: 1010, y: 462 },
    ],
  },
  // Sendero pedestre sur hacia la Huaca El Pueblo
  {
    name: 'Sendero Arqueológico Huaca El Pueblo',
    isMain: true,
    points: [
      { x: 860, y: 620 },
      { x: 875, y: 660 },
      { x: 895, y: 705 },
      { x: 885, y: 755 },
      { x: 905, y: 810 },
      { x: 890, y: 865 },
      { x: 900, y: 920 },
    ],
  },
];
