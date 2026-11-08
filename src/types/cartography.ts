export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapPoint {
  x: number; // 0 to 1920
  y: number; // 0 to 1080
}

export interface Waypoint {
  id: number;
  numberLabel: string;
  title: string;
  subtitle: string;
  time: string;
  category: 'restaurante' | 'parque' | 'mercado' | 'cooperativa' | 'colegio' | 'arqueologia';
  waypointType: 'stop' | 'transit'; // 'transit' para I.E. 11185 (punto de paso)
  description: string;
  targetProgress: number; // 0.0 to 1.0
  point: MapPoint;
  realCoords: LatLng;
  altitudeMeters: number;
  distanceFromStartMeters: number;
  googleMapsUrl?: string;
  referencePhotoUrl?: string;
  referencePhotoLabel?: string;
}

export interface PathNode extends MapPoint {
  t: number; // normalized 0.0 to 1.0 along the path
  speedFactor?: number;
}

export interface CameraFrame {
  centerX: number;
  centerY: number;
  zoom: number; // 1.0 (overview) to 2.8 (close-up)
  satelliteAlpha: number; // 0.0 (vector map) to 1.0 (satellite)
  bearing: number; // degrees
  pitch: number; // 0 to 20
}

export type ViewMode = 'auto' | 'map' | 'satellite';
export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;
