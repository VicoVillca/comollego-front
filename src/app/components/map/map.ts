import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy, 
  input, 
  output, 
  effect, 
  computed,
  signal
} from '@angular/core';
import * as L from 'leaflet';
import { Parada } from '../../models/transit.models';

declare module 'leaflet' {
  interface Marker {
    _draftData?: any;
    _stopId?: number;
  }
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ============================================================
  // INPUTS - EL MAPA SOLO RECIBE ESTO
  // ============================================================
  polyline = input<string>('');                    // String con coordenadas "lat,lng;lat,lng;..."
  stops = input<Parada[]>([]);                    // Array de paradas
  color = input<string>('#3B82F6');               // Color para líneas y marcadores
  mode = input<'view' | 'edit'>('view');          // Modo de operación

  // ============================================================
  // OUTPUTS
  // ============================================================
  mapClick = output<{lat: number, lng: number}>();     // Click en el mapa (para agregar puntos)
  stopClicked = output<Parada>();                       // Click en una parada
  dataChanged = output<{polyline: string, stops: Parada[]}>(); // Cambios en edición

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  private map: L.Map | null = null;
  private layers: L.Layer[] = [];
  private stopMarkers: Map<number, L.Marker> = new Map();
  private lastFittedPolyline: string | null = null;
  
  // Señal para saber si estamos en modo edición
  isEditMode = computed(() => this.mode() === 'edit');

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    // Efecto que escucha cambios en los inputs y re-renderiza
    effect(() => {
      // Forzar lectura de todas las señales
      const polyline = this.polyline();
      const stops = this.stops();
      const color = this.color();
      const mode = this.mode();
      
      console.log('🔄 Renderizando mapa...');
      console.log('📏 Polyline:', polyline ? `${polyline.split(';').length} puntos` : 'vacío');
      console.log('🚏 Stops:', stops.length);
      console.log('🎨 Color:', color);
      console.log('📋 Modo:', mode);
      
      if (this.map) {
        this.renderLayers();
      }
    });
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngAfterViewInit() {
    setTimeout(() => { 
      this.initMap(); 
    }, 300);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  // ============================================================
  // INICIALIZACIÓN DEL MAPA
  // ============================================================
  private initMap() {
    if (!this.mapContainer || this.map) return;

    console.log('🗺️ Inicializando mapa...');
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-16.4985, -68.1365],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20
    }).addTo(this.map);

    // Click en el mapa
    /*this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });*/

    this.map.invalidateSize();
    console.log('✅ Mapa inicializado');
    
    setTimeout(() => this.renderLayers(), 100);
  }

  // ============================================================
  // RENDERIZADO DE CAPAS
  // ============================================================
  private renderLayers() {
    if (!this.map) {
      console.warn('⚠️ Mapa no inicializado aún');
      return;
    }

    console.log('🧹 Limpiando capas anteriores...');
    this.layers.forEach(layer => layer.remove());
    this.layers = [];
    this.stopMarkers.clear();

    var polylineStr = this.polyline();
    const stops = this.stops();
    const color = this.color();
    const isEdit = this.isEditMode();

      if (!stops || stops.length === 0) {
        console.log('🧹 No hay paradas, limpiando polyline a vacío');
        polylineStr = '';
      }

    // Dibujar según el modo
    if (isEdit) {
      this.drawEditMode(polylineStr, stops, color);
    } else {
      this.drawViewMode(polylineStr, stops, color);
    }
  }

  // ============================================================
  // 🖼️ MODO VISUALIZACIÓN
  // ============================================================
  private drawViewMode(polylineStr: string, stops: Parada[], color: string) {
    if (!this.map) return;

    const coords = this.polylineToCoordinates(polylineStr);

    // 1. Dibujar polyline
    if (coords.length > 1) {
      const line = L.polyline(coords, {
        color: color,
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(this.map);
      this.layers.push(line);
    }

    // 2. Dibujar paradas
    const sortedStops = [...stops].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    
    sortedStops.forEach((stop, index) => {
      const icon = this.createStopIcon(stop.orden || index + 1, false, color);
      const marker = L.marker([stop.latitud, stop.longitud], { icon }).addTo(this.map!);
      
      if (stop.id) {
        this.stopMarkers.set(stop.id, marker);
      }
      
      marker.bindPopup(`
        <div class="p-2 select-none">
          <h4 class="font-bold text-sm text-neutral-900 m-0">${stop.nombre}</h4>
        </div>
      `);

      marker.on('click', () => {
        this.stopClicked.emit(stop);
      });

      this.layers.push(marker);
    });

    // 3. Ajustar vista
    if (coords.length > 1 && this.lastFittedPolyline !== polylineStr) {
      try {
        const bounds = L.latLngBounds(coords);
        this.map.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 15,
          animate: true,
          duration: 1
        });
        this.lastFittedPolyline = polylineStr;
      } catch (e) {
        console.warn('⚠️ No se pudo ajustar la vista:', e);
      }
    }
  }

  // ============================================================
  // ✏️ MODO EDICIÓN
  // ============================================================
  private drawEditMode(polylineStr: string, stops: Parada[], color: string) {
    if (!this.map) return;

    const coords = this.polylineToCoordinates(polylineStr);
    const finalColor = color || '#EF4444';

    console.log(`✏️ Dibujando modo edición con ${coords.length} coordenadas y ${stops.length} paradas`);

    // 1. LÍNEA EDITABLE (punteada)
    if (coords.length > 1) {
      const line = L.polyline(coords, {
        color: finalColor,
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(this.map);
      this.layers.push(line);
    }

    // 2. PUNTOS DEL POLYLINE (arrastrables)
    coords.forEach((coord, i) => {
      const nodeIcon = L.divIcon({
        html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-md" style="background-color: ${finalColor}"></div>`,
        className: 'custom-node-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const nodeMarker = L.marker(coord, {
        icon: nodeIcon,
        draggable: true
      }).addTo(this.map!);

      nodeMarker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        const updatedCoords = [...coords];
        updatedCoords[i] = [newLatLng.lat, newLatLng.lng];

        // Actualizar paradas cercanas
        const updatedStops = stops.map(stop => {
          const isClose = Math.abs(stop.latitud - coord[0]) < 0.0003 && 
                         Math.abs(stop.longitud - coord[1]) < 0.0003;
          if (isClose) {
            return { ...stop, latitud: newLatLng.lat, longitud: newLatLng.lng };
          }
          return stop;
        });

        this.emitDataChanged(updatedCoords, updatedStops);
      });

      nodeMarker.bindTooltip(`Punto ${i + 1}`, {
        direction: 'top',
        offset: [0, -8]
      });

      this.layers.push(nodeMarker);
    });

    // 3. PARADAS (arrastrables)
    const sortedStops = [...stops].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    
    sortedStops.forEach((stop, index) => {
      const icon = this.createStopIcon(stop.orden || index + 1, true, finalColor);
      const marker = L.marker([stop.latitud, stop.longitud], {
        icon,
        draggable: true
      }).addTo(this.map!);

      if (stop.id) {
        this.stopMarkers.set(stop.id, marker);
      }

      // Guardar referencia a la parada
      (marker as any)._stopData = stop;

      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        const stopData = (e.target as any)._stopData;

        this.handleStopDrag(stopData, newLatLng, coords, stops);
      });

      marker.bindPopup(`
  <div class="p-1.5 select-none font-sans">
    <p class="text-sm font-semibold text-neutral-800 m-0">${stop.nombre}</p>
  </div>
`);

      this.layers.push(marker);
    });

    // 4. PUNTOS MEDIOS PARA ESTIRAR
    for (let i = 0; i < coords.length - 1; i++) {
      const c1 = coords[i];
      const c2 = coords[i + 1];
      const midLat = (c1[0] + c2[0]) / 2;
      const midLng = (c1[1] + c2[1]) / 2;

      const midIcon = L.divIcon({
        html: `<div class="w-5 h-5 rounded-full bg-orange-400 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:scale-125 transition-transform">+</div>`,
        className: 'custom-mid-node-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const midMarker = L.marker([midLat, midLng], {
        icon: midIcon,
        draggable: true
      }).addTo(this.map!);

      midMarker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        const updatedCoords = [...coords];
        updatedCoords.splice(i + 1, 0, [newLatLng.lat, newLatLng.lng]);

        this.emitDataChanged(updatedCoords, stops);
      });

      midMarker.bindTooltip(`➕ Estirar`, {
        direction: 'top',
        offset: [0, -5]
      });

      this.layers.push(midMarker);
    }
  }

// ============================================================
// 🔄 MANEJAR ARRASTRE DE PARADA (CORREGIDO)
// ============================================================
// En map.ts
private handleStopDrag(
  stop: Parada, 
  newLatLng: L.LatLng, 
  coords: [number, number][],
  stops: Parada[]
) {
  // 🔥 BUSCAR POR LATITUD Y LONGITUD (NO POR ÍNDICE)
  const pointIndex = coords.findIndex(
    coord => coord[0] === stop.latitud && coord[1] === stop.longitud
  );
  
  if (pointIndex === -1) {
    console.warn('⚠️ Punto no encontrado para la parada:', stop.nombre);
    console.warn('   Buscando:', stop.latitud, stop.longitud);
    console.warn('   En polyline:', coords);
    return;
  }
  
  console.log(`📍 Arrastrando parada "${stop.nombre}"`);
  console.log(`   Punto encontrado en índice: ${pointIndex}`);
  console.log(`   Nueva posición: ${newLatLng.lat}, ${newLatLng.lng}`);
  
  // Actualizar la parada
  const updatedStops = stops.map(s => {
    if (s.id === stop.id) {
      return { ...s, latitud: newLatLng.lat, longitud: newLatLng.lng };
    }
    return s;
  });

  // 🔥 Actualizar el punto en el índice encontrado
  const updatedCoords = [...coords];
  updatedCoords[pointIndex] = [newLatLng.lat, newLatLng.lng];

  this.emitDataChanged(updatedCoords, updatedStops);
}
  // ============================================================
  // 📤 EMITIR CAMBIOS AL PADRE
  // ============================================================
  private emitDataChanged(coords: [number, number][], stops: Parada[]) {
    const polyline = this.coordinatesToPolyline(coords);
    this.dataChanged.emit({
      polyline: polyline,
      stops: stops
    });
  }

  // ============================================================
  // 🎯 CREACIÓN DE ÍCONO DE PARADA
  // ============================================================
  private createStopIcon(sequence: number, isDraft: boolean = false, color: string = '#64748b'): L.DivIcon {
    const size = 28;
    const fontSize = 11;
    
    return L.divIcon({
      html: `
        <div class="stop-marker-wrapper">
          <div 
            class="stop-marker-circle ${isDraft ? 'draft' : ''}"
            style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: 2px solid ${isDraft ? '#f59e0b' : color};
              background-color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${fontSize}px;
              font-weight: 700;
              color: #1e293b;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              transition: all 0.2s ease;
              ${isDraft ? 'border-style: dashed;' : ''}
            "
          >
            ${sequence}
          </div>
        </div>
      `,
      className: 'custom-stop-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  private polylineToCoordinates(polyline: string | undefined): [number, number][] {
    if (!polyline) return [];
    return polyline.split(';').filter(p => p).map(pair => {
      const [lat, lng] = pair.split(',').map(Number);
      return [lat, lng];
    });
  }

  private coordinatesToPolyline(coords: [number, number][]): string {
    return coords.map(coord => `${coord[0]},${coord[1]}`).join(';');
  }

  // ============================================================
  // CONTROLES DE ZOOM
  // ============================================================
  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  zoomOut() {
    if (this.map) this.map.zoomOut();
  }
}