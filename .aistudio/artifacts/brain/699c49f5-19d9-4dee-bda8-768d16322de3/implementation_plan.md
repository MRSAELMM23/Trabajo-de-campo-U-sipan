# Reconstrucción Cartográfica y Animación Documental: Recorrido Úcupe – Huaca El Pueblo

Animación cartográfica documental de alta fidelidad que reconstruye el recorrido peatonal del equipo universitario en Úcupe (Lambayeque, Perú) el 7 de noviembre de 2026, transitando de la cartografía vectorial de Google Maps a la vista satelital de Google Earth en formato 16:9 con exportador de video HD.

> [!IMPORTANT]
> **Decisiones Críticas Confirmadas con el Usuario:**
> - **Controles de Reproducción**: Reproductor con línea de tiempo interactiva, marcadores por hito y controles cinematográficos de reproducción/pausa/velocidad.
> - **Transición Visual**: Disolvencia y morphing progresivo de vista vectorial Google Maps a vista satelital fotográfica Google Earth a medida que el recorrido avanza desde la Cooperativa Agraria hacia la zona arqueológica.
> - **Exportación de Video**: Grabador integrado con MediaRecorder API que captura la animación directamente del canvas para descarga inmediata en formato WebM HD a 60 fps.

---

## 1. Overview & Core Concept

### Qué Hace la Aplicación
Una estación audiovisual y cartográfica diseñada con estética rigurosa de Google Maps y Google Earth. Proyecta en proporción fija 16:9 (Full HD) una cámara cenital y semiperspectiva suave que navega con fluidez absoluta por el centro poblado de Úcupe y sus senderos rurales:
1. **Inicio**: Acceso y paradero norte del núcleo urbano de Úcupe.
2. **Primera Parada**: Restaurante local (almuerzo universitario).
3. **Segunda Parada**: Plaza Principal de Úcupe (eje cívico central).
4. **Tercera Parada**: Mercado local de abastos.
5. **Cuarta Parada**: Antigua Cooperativa Agraria Úcupe (umbral urbano-rural).
6. **Destino Final**: Plataforma monumental de la Huaca El Pueblo Úcupe.

A lo largo de los 15 a 20 segundos de duración, una línea peatonal amarilla canónica de Google Maps se traza sobre las vías reales, acompañada de pines de localización limpios, telemetría de distancia caminada, escala métrica dinámica y la transición a fotografía satelital del contexto territorial.

---

## 2. User Experience & Visual Design

### Flujo de Usuario Principal
1. **Vista de Inicio en Pantalla 16:9**: El visor arranca con una toma panorámica aérea del valle y centro poblado de Úcupe, con interfaz minimalista de Google Maps (barra de búsqueda académica "Úcupe, Lambayeque - Recorrido de Campo", escala gráfica, brújula y selector de vista).
2. **Reproducción Cinematográfica**: Al pulsar *Play* (o reproducir automáticamente), la cámara hace un zoom progresivo y suave hacia el punto de inicio. La línea amarilla comienza a trazarse sincronizada con el cursor de posición de los estudiantes.
3. **Hitos y Paradas**: En cada estación, el trazado se detiene sutilmente (o desacelera de manera documental), desplegando una tarjeta flotante minimalista con el nombre de la parada y la hora/referencia del 7 de noviembre de 2026.
4. **Transición Progresiva Satelital**: Al alcanzar la parada 4 (Cooperativa Agraria) y tomar el camino rural, la cartografía vectorial realiza una transición transparente y gradual hacia la capa satelital de alta resolución, revelando el relieve, campos de cultivo y la morfología arqueológica de la Huaca.
5. **Cierre en Huaca El Pueblo**: La animación concluye con un encuadre cenital enfocado en el montículo monumental de Huaca El Pueblo Úcupe, exhibiendo la relación espacial completa con el pueblo.
6. **Grabación y Exportación HD**: El usuario puede presionar en cualquier momento "Exportar Video HD (WebM)" para generar una captura limpia del canvas sin botones de UI y descargar el archivo de video listo para presentaciones académicas o edición de video.

### Identidad Visual y Paleta (Autenticidad Google Maps / Earth)
- **Modo Cartográfico**: Base neutra `#F4F3F0`, manzanas urbanas `#EBE7E0`, vías y calles `#FFFFFF` con reborde `#D7D3CC`, áreas verdes `#CEEAC8`, línea de recorrido peatonal `#F4B400` (amarillo vial Google) con halo `#FFFFFF` y patrón de puntos peatonales.
- **Modo Satelital**: Fotografía satelital texturizada con tonalidades desértico-agrícolas de la costa norte peruana (tonos ocre, arcilla, parcelas verdes y relieve adobe).
- **Tipografía**: `Plus Jakarta Sans` y `DM Sans` para rotulación geográfica clara y legible, emparejada con cifras tabulares (`tabular-nums font-mono`) para coordenadas geográficas reales (-7.0315°, -79.6274°), escala métrica (50m / 100m) y cronómetro de recorrido.
- **Marcadores de Google Maps**: Pines vectoriales estilizados (rojo Google `#EA4335`, amarillo ruta `#FBBC04`, azul Google `#4285F4`) con tipografía condensada y sin saturación estridente.

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Google Maps UI: "Úcupe, Lambayeque · Trabajo de Campo 07/11/2026"]   │
│                                                                        │
│         [Paradero / Inicio]                                           │
│                 \                                                      │
│                  \==[Restaurante]                                      │
│                           \                                            │
│                      [Plaza Principal]                                 │
│                             \                                          │
│                          [Mercado]                                     │
│                               \                                        │
│                           [Cooperativa] ── (Transición Satélite) ──┐   │
│                                                                    │   │
│                                                                    │   │
│                                                 [Huaca El Pueblo] ◄┘   │
├────────────────────────────────────────────────────────────────────────┤
│ [▶ Play/Pause] [⏪ 00:00 / 00:18] ──●──────── [Velocidad: 1x] [⬇ HD]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Decisiones Clave de Producto & Trade-offs

1. **Renderizado de Alta Tasa de Refresco con Canvas 2D + Doble Capa Cartográfica**:
   - *Decisión*: Motor de renderizado vectorial y satelital desacoplado sobre un `<canvas>` acelerado por hardware a 60 FPS, en vez de incrustar iframes lentos o estáticos.
   - *Por qué*: Permite control total milimétrico de la curva de aceleración de la cámara (interpolación hermite/bezier), renderizado continuo de la línea amarilla animada, sincronización de la transición satelital alfa y captura limpia mediante `canvas.captureStream()` para grabación sin pérdida de frames.
2. **Precisión Toponímica y Respeto a las Restricciones**:
   - *Decisión*: No inventar marcas ni franquicias para el restaurante local; mantener la denominación rigurosa "Restaurante Local (Almuerzo)"; conservar la ubicación geográfica fidedigna de la Huaca El Pueblo respecto al trazado sur del pueblo de Úcupe.
   - *Por qué*: Cumple de manera irrestricta con la exigencia documental y académica del prompt de no crear elementos imaginarios ni alterar la arqueología real.
3. **Módulo de Grabación WebM en Tiempo Real**:
   - *Decisión*: Implementar un exportador con `MediaRecorder` que graba el canvas de renderizado a resolución nativa 1920x1080 (o 1280x720) a 60fps con códec VP9/VP8 y genera descarga instantánea de archivo `.webm`.
   - *Por qué*: Permite que el usuario obtenga directamente el archivo de video solicitado para su uso audiovisual profesional sin necesidad de capturadoras de pantalla externas.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama del Sistema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             React Root (App)                             │
├────────────────────────────┬─────────────────────────────────────────────┤
│   Top Bar Documental       │   Selector de Modo (Mapa / Satélite / Auto)  │
│   · Título y Contexto      │   · Información de Coordenadas y Escala     │
├────────────────────────────┴─────────────────────────────────────────────┤
│                                                                          │
│                 Viewport 16:9 Canvas Stage (1920x1080)                   │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │ 1. Vector Map Layer (Calles, Manzanas, Trazado Urbano de Úcupe)   │   │
│   │ 2. Satellite Aerial Layer (Fotografía de Textura de Lambayeque) │   │
│   │ 3. Path Renderer (Línea amarilla peatonal + puntos animados)     │   │
│   │ 4. Waypoint Markers (Inicio -> Restaurante -> Plaza -> etc.)     │   │
│   │ 5. HUD Google Maps (Brújula, escala gráfica, visor de destino)   │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                       Deck de Control Cinematográfico                    │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │ [▶ Play] [⏸ Pause] [↺ Reiniciar]                                  │   │
│   │ Barra de Scrubbing (0 a 18 seg) con hitos 1..6 clickeables       │   │
│   │ Selector de Velocidad (0.5x, 1x, 1.5x, 2x)                       │   │
│   │ Botón "Descargar Video WebM Full HD"                             │   │
│   └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos del Recorrido (Waypoints y Trazado)
- **Waypoints del Equipo Universitario**:
  - `id: 1, name: "Punto de Inicio: Paradero Centro Poblado Úcupe", t: 0.0, coords, desc: "Llegada al núcleo urbano de Úcupe"`
  - `id: 2, name: "Primera Parada: Restaurante Local", t: 0.20, coords, desc: "Almuerzo del equipo universitario"`
  - `id: 3, name: "Segunda Parada: Plaza Principal de Úcupe", t: 0.40, coords, desc: "Núcleo cívico y centro del pueblo"`
  - `id: 4, name: "Tercera Parada: Mercado Local", t: 0.58, coords, desc: "Continuación por las vías urbanas"`
  - `id: 5, name: "Cuarta Parada: Antigua Cooperativa Agraria Úcupe", t: 0.75, coords, desc: "Umbral hacia caminos rurales y zona arqueológica"`
  - `id: 6, name: "Destino Final: Huaca El Pueblo Úcupe", t: 1.0, coords, desc: "Sitio arqueológico Moche, plataforma monumental"`

### Rutas y Componentes Planificados
- `src/components/CartographicPlayer.tsx`: Lienzo principal 16:9, lógica de animación de cámara, dibujado progresivo de ruta, blend vector-satelital.
- `src/components/PlaybackControls.tsx`: Controles de reproducción con scrubber de tiempo, saltos a hitos, botón de pantalla completa y selector de velocidad.
- `src/components/WaypointsDrawer.tsx`: Panel lateral desplegable con la bitácora documental del 7 de noviembre de 2026.
- `src/components/VideoRecorderModal.tsx`: Estado de renderizado de video y descarga del archivo `.webm` con barra de progreso.
- `src/utils/cartographyEngine.ts`: Funciones de interpolación espacial de cámara, proyección cenital, trazado de calles reales y texturas satelitales.
