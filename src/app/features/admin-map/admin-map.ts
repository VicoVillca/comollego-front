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
import { Parada } from '../../core/models/transit.models';

declare module 'leaflet' {
  interface Marker {
    _draftData?: any;
    _stopId?: number;
  }
}

@Component({
  selector: 'app-admin-map',
  standalone: true,
  templateUrl: './admin-map.html',
  styleUrl: './admin-map.css'
})
export class AdminMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ============================================================
  // INPUTS
  // ============================================================
  polyline = input<string>('');
  stops = input<Parada[]>([]);
  color = input<string>('#3B82F6');
  mode = input<'view' | 'edit'>('view');
  selectedLocation = input<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // OUTPUTS
  // ============================================================
  mapClick = output<{lat: number, lng: number}>();
  stopClicked = output<Parada>();
  dataChanged = output<{polyline: string, stops: Parada[]}>();
  locationCleared = output<void>();

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  private map: L.Map | null = null;
  private layers: L.Layer[] = [];
  private stopMarkers: Map<number, L.Marker> = new Map();
  private lastFittedPolyline: string | null = null;
  private selectedMarker: L.Marker | null = null;
  
  isEditMode = computed(() => this.mode() === 'edit');

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    effect(() => {
      const polyline = this.polyline();
      const stops = this.stops();
      const color = this.color();
      const mode = this.mode();
      const location = this.selectedLocation();
      
      console.log('🔄 Renderizando mapa admin...');
      console.log('📏 Polyline:', polyline ? `${polyline.split(';').length} puntos` : 'vacío');
      console.log('🚏 Stops:', stops.length);
      console.log('✏️ Modo:', mode);
      console.log('📍 Ubicación seleccionada:', location);
      
      if (this.map) {
        this.renderLayers();
        if (location) {
          this.showSelectedLocation(location);
        } else {
          this.clearSelectedMarker();
        }
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

    console.log('🗺️ Inicializando mapa admin...');
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-16.4985, -68.1365],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20
    }).addTo(this.map);

    // Click en el mapa - solo en modo edición
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.isEditMode()) {
        this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    this.map.invalidateSize();
    console.log('✅ Mapa admin inicializado');
    
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

    const polylineStr = this.polyline();
    const stops = this.stops();
    const color = this.color();
    const isEdit = this.isEditMode();

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

    if (coords.length > 1) {
      const line = L.polyline(coords, {
        color: color,
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(this.map);
      this.layers.push(line);
    }

    const sortedStops = [...stops].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    
    sortedStops.forEach((stop, index) => {
      const icon = this.createStopIcon(stop.orden || index + 1, false);
      const marker = L.marker([stop.latitud, stop.longitud], { icon }).addTo(this.map!);
      
      if (stop.id) {
        this.stopMarkers.set(stop.id, marker);
      }
      
      marker.bindPopup(`
        <div class="p-2 select-none">
          <h4 class="font-bold text-sm text-neutral-900 m-0">${stop.nombre}</h4>
          <p class="text-xs text-neutral-500 mt-1 mb-0">
            Orden: <span class="bg-neutral-100 px-1 py-0.5 rounded font-mono text-neutral-700">${stop.orden || index + 1}</span>
          </p>
        </div>
      `);

      marker.on('click', () => {
        this.stopClicked.emit(stop);
      });

      this.layers.push(marker);
    });

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
      const icon = this.createStopIcon(stop.orden || index + 1, true);
      const marker = L.marker([stop.latitud, stop.longitud], {
        icon,
        draggable: true
      }).addTo(this.map!);

      if (stop.id) {
        this.stopMarkers.set(stop.id, marker);
      }

      (marker as any)._stopData = stop;

      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        const stopData = (e.target as any)._stopData;
        this.handleStopDrag(stopData, newLatLng, coords, stops);
      });

      marker.bindPopup(`
        <div class="p-2 select-none font-sans min-w-[180px]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-1">
                <span class="text-amber-500 text-xs">✎</span>
                <span class="text-[10px] font-bold text-amber-600">PARADA BORRADOR</span>
              </div>
              <p class="text-sm font-semibold text-neutral-800 m-0">${stop.nombre}</p>
              <p class="text-[10px] text-neutral-500 m-0">🔄 Arrastra para mover</p>
            </div>
            <button 
              class="bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center transition-colors border border-red-200 hover:border-red-300"
              onclick="window.dispatchEvent(new CustomEvent('deleteStop', { detail: { stopId: ${stop.id}, stopName: '${stop.nombre}' } }))"
              title="Eliminar parada"
            >
              ✕
            </button>
          </div>
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
  // 🔄 MANEJAR ARRASTRE DE PARADA
  // ============================================================
  private handleStopDrag(
    stop: Parada, 
    newLatLng: L.LatLng, 
    coords: [number, number][],
    stops: Parada[]
  ) {
    const stopIndex = stops.findIndex(s => s.id === stop.id);
    
    console.log(`📍 Arrastrando parada "${stop.nombre}" (índice: ${stopIndex})`);
    
    const updatedStops = stops.map(s => {
      if (s.id === stop.id) {
        return { ...s, latitud: newLatLng.lat, longitud: newLatLng.lng };
      }
      return s;
    });

    const updatedCoords = [...coords];
    
    if (stopIndex < updatedCoords.length) {
      updatedCoords[stopIndex] = [newLatLng.lat, newLatLng.lng];
    } else {
      updatedCoords.push([newLatLng.lat, newLatLng.lng]);
    }

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
  private createStopIcon(sequence: number, isDraft: boolean = false): L.DivIcon {
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
              border: 2px solid ${isDraft ? '#f59e0b' : '#64748b'};
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
  // 📍 MARCADOR DE UBICACIÓN SELECCIONADA
  // ============================================================
  private showSelectedLocation(location: { lat: number; lng: number; nombre: string }) {
    if (!this.map) return;

    this.clearSelectedMarker();

    const icon = L.icon({
      iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    this.selectedMarker = L.marker([location.lat, location.lng], {
      icon: icon,
      zIndexOffset: 1000
    }).addTo(this.map);

    this.selectedMarker.bindPopup(`
      <div class="p-2 select-none min-w-[150px]">
        <h4 class="font-bold text-sm text-neutral-900 m-0">${location.nombre}</h4>
      </div>
    `);

    this.map.setView([location.lat, location.lng], 16, {
      animate: true,
      duration: 1
    });

    setTimeout(() => {
      if (this.selectedMarker) {
        this.selectedMarker.openPopup();
      }
    }, 300);
  }

  private clearSelectedMarker() {
    if (this.selectedMarker) {
      this.map?.removeLayer(this.selectedMarker);
      this.selectedMarker = null;
      this.locationCleared.emit();
    }
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