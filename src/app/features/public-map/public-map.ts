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

@Component({
  selector: 'app-public-map',
  standalone: true,
  templateUrl: './public-map.html',
  styleUrl: './public-map.css'
})
export class PublicMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ============================================================
  // INPUTS
  // ============================================================
  polyline = input<string>('');
  stops = input<Parada[]>([]);
  color = input<string>('#3B82F6');
  selectedLocation = input<{ lat: number; lng: number; nombre: string } | null>(null);

  origen = input<{ lat: number; lng: number; nombre?: string } | null>(null);
  destino = input<{ lat: number; lng: number; nombre?: string } | null>(null);
  rutaPolyline = input<string>('');
  rutaColor = input<string>('#3B82F6');

  // ============================================================
  // OUTPUTS
  // ============================================================
  stopClicked = output<Parada>();
  mapClicked = output<{lat: number, lng: number}>();
  locationCleared = output<void>();

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  private map: L.Map | null = null;
  private layers: L.Layer[] = [];
  private stopMarkers: Map<number, L.Marker> = new Map();
  private lastFittedPolyline: string | null = null;
  private selectedMarker: L.Marker | null = null;
  private origenMarker: L.Marker | null = null;
  private destinoMarker: L.Marker | null = null;
  private rutaPolylineLayer: L.Polyline | null = null;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    effect(() => {
      const polyline = this.polyline();
      const stops = this.stops();
      const color = this.color();
      const location = this.selectedLocation();
      const origen = this.origen();
      const destino = this.destino();
      const rutaPolyline = this.rutaPolyline();
      const rutaColor = this.rutaColor();
      
      console.log('🔄 Renderizando mapa público...');
      console.log('📍 selectedLocation:', location);
      console.log('🟢 origen:', origen);
      console.log('🔴 destino:', destino);
      console.log('📏 rutaPolyline:', rutaPolyline ? 'Sí' : 'No');
      
      if (this.map) {
        this.renderLayers();
        
        if (origen) {
          this.showOrigenMarker(origen);
        } else {
          this.clearOrigenMarker();
        }
        
        if (destino) {
          this.showDestinoMarker(destino);
        } else {
          this.clearDestinoMarker();
        }
        
        if (rutaPolyline) {
          this.showRutaPolyline(rutaPolyline, rutaColor);
        } else {
          this.clearRutaPolyline();
        }
        
        if (location) {
          this.showSelectedLocation(location);
        } else {
          this.clearSelectedMarkerSilent();
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

    console.log('🗺️ Inicializando mapa público...');
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-16.4985, -68.1365],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.map.invalidateSize();
    console.log('✅ Mapa público inicializado');
    
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

    this.drawViewMode(polylineStr, stops, color);
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
      const icon = this.createStopIcon(stop.orden || index + 1);
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
  // 🔥 MARCADOR DE ORIGEN (Verde con "O")
  // ============================================================
private showOrigenMarker(location: { lat: number; lng: number; nombre?: string }) {
  if (!this.map) return;
  this.clearOrigenMarker();

  const isMobile = window.innerWidth <= 768;
  const size = isMobile ? 48 : 44;
  const fontSize = isMobile ? 26 : 22;

  const icon = L.divIcon({
    html: `
      <div style="
        background: white;
        border-radius: 50%; 
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border: 4px solid #22c55e;
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
        font-size: ${fontSize}px;
        transition: all 0.3s ease;
      ">
        🚶
      </div>
    `,
    className: 'origen-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });

  this.origenMarker = L.marker([location.lat, location.lng], { 
    icon,
    zIndexOffset: 1000 
  }).addTo(this.map);

  const popupContent = location.nombre 
    ? `<div style="padding: 4px;"><strong>🚶 Origen:</strong> ${location.nombre}</div>` 
    : '🚶 Origen';
  this.origenMarker.bindPopup(popupContent);
  
  //this.centerMapBetweenOrigenAndDestino();
const destinoPos = this.destinoMarker?.getLatLng();

  if (!destinoPos) {
    console.warn('⚠️ No hay origen y destino para centrar');
    return;
  }
        this.centerMapOnPositions([
      { lat: location.lat, lng: location.lng },
      { lat: destinoPos.lat, lng: destinoPos.lng }
    ], 50);
  
  console.log('✅ Marcador de ORIGEN mostrado:', location.nombre);
}

private centerMapBetweenOrigenAndDestino() {
  if (!this.map) return;
  
  // Obtener las posiciones
  const origenPos = this.origenMarker?.getLatLng();
  const destinoPos = this.destinoMarker?.getLatLng();
  
  // Si no hay ambos marcadores, no hacer nada
  if (!origenPos || !destinoPos) {
    console.warn('⚠️ No hay origen y destino para centrar');
    return;
  }
  
  // Calcular el centro entre ambos puntos
  const centerLat = (origenPos.lat + destinoPos.lat) / 2;
  const centerLng = (origenPos.lng + destinoPos.lng) / 2;
  
  // Calcular la distancia para ajustar el zoom automáticamente
  const latDiff = Math.abs(origenPos.lat - destinoPos.lat);
  const lngDiff = Math.abs(origenPos.lng - destinoPos.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Ajustar zoom según la distancia
  let zoom = 14;
  if (maxDiff > 0.5) zoom = 11;
  else if (maxDiff > 0.2) zoom = 12;
  else if (maxDiff > 0.1) zoom = 13;
  else if (maxDiff > 0.05) zoom = 14;
  else if (maxDiff > 0.02) zoom = 15;
  else zoom = 16;
  
  zoom --;
  // Centrar el mapa con animación
  this.map.setView([centerLat, centerLng], zoom, {
    animate: true,
    duration: 1.5,
    easeLinearity: 0.25
  });
  
  console.log('✅ Mapa centrado entre ORIGEN y DESTINO');
}

  private clearOrigenMarker() {
    if (this.origenMarker) {
      this.map?.removeLayer(this.origenMarker);
      this.origenMarker = null;
      console.log('🗑️ Marcador de ORIGEN eliminado');
    }
  }

  // ============================================================
  // 🔥 MARCADOR DE DESTINO (Rojo con "D")
  // ============================================================
private showDestinoMarker(location: { lat: number; lng: number; nombre?: string }) {
  if (!this.map) return;
  this.clearDestinoMarker();

  const isMobile = window.innerWidth <= 768;
  const size = isMobile ? 48 : 44;
  const fontSize = isMobile ? 26 : 22;

  const icon = L.divIcon({
    html: `
      <div style="
        background: white;
        border-radius: 50%; 
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border: 4px solid #3b82f6;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        font-size: ${fontSize}px;
        transition: all 0.3s ease;
      ">
        🏁
      </div>
    `,
    className: 'destino-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });

  this.destinoMarker = L.marker([location.lat, location.lng], { 
    icon,
    zIndexOffset: 1000 
  }).addTo(this.map);
  

      this.centerMapOnPositions([
      { lat: location.lat, lng: location.lng }
    ], 50);

  // Opcional: Abrir el popup automáticamente
  setTimeout(() => {
    if (this.destinoMarker) {
      this.destinoMarker.openPopup();
    }
  }, 300);
  
  console.log('✅ Marcador de DESTINO mostrado y centrado:', location.nombre);
}

  private clearDestinoMarker() {
    if (this.destinoMarker) {
      this.map?.removeLayer(this.destinoMarker);
      this.destinoMarker = null;
      console.log('🗑️ Marcador de DESTINO eliminado');
    }
  }


  // ============================================================
// 🔥 CENTRAR MAPA EN MÚLTIPLES POSICIONES
// ============================================================
private centerMapOnPositions(positions: { lat: number; lng: number }[], padding: number = 80) {
  if (!this.map || !positions || positions.length === 0) {
    console.warn('⚠️ No hay posiciones para centrar');
    return;
  }

  // Si solo hay una posición, centrar con zoom 16
  if (positions.length === 1) {
    this.map.setView([positions[0].lat, positions[0].lng], 16, {
      animate: true,
      duration: 1.5,
      easeLinearity: 0.25
    });
    console.log('✅ Mapa centrado en posición única');
    return;
  }

  // Si hay múltiples posiciones, calcular bounds
  try {
    // Crear bounds con todas las posiciones
    const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
    
    // Ajustar el mapa a los bounds con padding
    this.map.fitBounds(bounds, {
      padding: [padding, padding],
      maxZoom: 16,
      animate: true,
      duration: 1.5,
      easeLinearity: 0.25
    });
    
    console.log(`✅ Mapa centrado en ${positions.length} posiciones`);
  } catch (e) {
    console.warn('⚠️ Error al centrar el mapa:', e);
  }
}
  // ============================================================
  // 🔥 POLYLINE DE LA RUTA SELECCIONADA
  // ============================================================
  private showRutaPolyline(polylineStr: string, color: string) {
    if (!this.map) return;
    this.clearRutaPolyline();

    const coords = this.polylineToCoordinates(polylineStr);
    if (coords.length > 1) {
      this.rutaPolylineLayer = L.polyline(coords, {
        color: color,
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(this.map);
      
      console.log('✅ Polyline de ruta mostrado');
      
      try {
        const bounds = L.latLngBounds(coords);
        this.map.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 15,
          animate: true,
          duration: 1
        });
      } catch (e) {
        console.warn('⚠️ No se pudo ajustar la vista:', e);
      }
    }
  }

  private clearRutaPolyline() {
    if (this.rutaPolylineLayer) {
      this.map?.removeLayer(this.rutaPolylineLayer);
      this.rutaPolylineLayer = null;
      console.log('🗑️ Polyline de ruta eliminado');
    }
  }

  // ============================================================
  // 🔥 LIMPIAR TODO
  // ============================================================
  clearAll() {
    this.clearOrigenMarker();
    this.clearDestinoMarker();
    this.clearRutaPolyline();
    this.clearSelectedMarker();
    console.log('🗑️ Todo limpiado');
  }

  // ============================================================
  // 📍 MARCADOR DE UBICACIÓN SELECCIONADA (SIN EMITIR)
  // ============================================================
  private showSelectedLocation(location: { lat: number; lng: number; nombre: string }) {
  }

  // ============================================================
  // 📍 LIMPIAR MARCADOR SELECCIONADO (CON EMITIR)
  // ============================================================
  private clearSelectedMarker() {
    if (this.selectedMarker) {
      this.map?.removeLayer(this.selectedMarker);
      this.selectedMarker = null;
      this.locationCleared.emit();
      console.log('🗑️ Marcador eliminado (con emit)');
    }
  }

  // ============================================================
  // 📍 LIMPIAR MARCADOR SELECCIONADO (SIN EMITIR)
  // ============================================================
  private clearSelectedMarkerSilent() {
    if (this.selectedMarker) {
      this.map?.removeLayer(this.selectedMarker);
      this.selectedMarker = null;
      console.log('🗑️ Marcador eliminado (sin emitir)');
    }
  }

  // ============================================================
  // 🎯 CREACIÓN DE ÍCONO DE PARADA
  // ============================================================
  private createStopIcon(sequence: number): L.DivIcon {
    const size = 28;
    const fontSize = 11;
    
    return L.divIcon({
      html: `
        <div class="stop-marker-wrapper">
          <div 
            class="stop-marker-circle"
            style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: 2px solid #64748b;
              background-color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${fontSize}px;
              font-weight: 700;
              color: #1e293b;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              transition: all 0.2s ease;
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