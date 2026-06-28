import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Ruta, Parada } from '../../../core/models/transit.models';
import { GamificationService } from '../../../core/services/gamification.service';
import { RouteService } from '../../../core/services/route.service';

@Component({
  selector: 'app-route-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './route-editor.html',
  styleUrl: './route-editor.css'
})
export class RouteEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ============================================================
  // INYECCIONES
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly gamification = inject(GamificationService);
  private routeParam = inject(ActivatedRoute);
  private router = inject(Router);

  // ============================================================
  // 🗺️ MAPA - CONTROL DE ZOOM
  // ============================================================
  private map: L.Map | null = null;
  private layers: L.Layer[] = [];
  private stopMarkers: Map<number, L.Marker> = new Map();
  private isMapReady = false;
  private isDragging = false;
  private shouldFitBounds = true;

  // ============================================================
  // TABS
  // ============================================================
  activeTab = signal<'data' | 'stops'>('data');

  // ============================================================
  // SIGNALS PARA DIRECCIÓN
  // ============================================================
  activeDirection = signal<'ida' | 'vuelta'>('ida');

  // ============================================================
  // CAMPOS DEL FORMULARIO
  // ============================================================
  editNombreRuta = '';
  editCodigo = '';
  editColor = '#3b82f6';
  editTipoTransporteId: number = 1;
  editEstado: 'activo' | 'mantenimiento' | 'suspendido' = 'activo';
  editDistanciaKm: number = 0;
  editDuracionMin: number = 0;
  editIntervaloMin: number = 5;
  editSindicatoId: number = 1;
  editDescripcion = '';
  editPolylineIda = '';
  editPolylineVuelta = '';

  // ============================================================
  // NUEVA PARADA
  // ============================================================
  newStopName = '';
  errorMessage = '';

  // ============================================================
  // OPCIONES PARA SELECTS
  // ============================================================
  tiposTransporte = [
    { id: 1, nombre: 'Minibús', icon: '🚐' },
    { id: 2, nombre: 'Trufi', icon: '🚗' },
    { id: 3, nombre: 'Teleférico', icon: '🚡' },
    { id: 4, nombre: 'PumaKatari', icon: '🚌' },
    { id: 5, nombre: 'Micro', icon: '🚚' }
  ];

  estados: Array<'activo' | 'mantenimiento' | 'suspendido'> = [
    'activo',
    'mantenimiento',
    'suspendido'
  ];

  colorPalette = [
    '#E53935', '#FDD835', '#43A047', '#1E88E5', '#FB8C00',
    '#CFD8DC', '#00ACC1', '#8E24AA', '#6D4C41', '#78909C',
    '#D81B60', '#00897B'
  ];

  sindicatos = [
    { id: 1, nombre: 'Sindicato Litoral', descripcion: 'Zona Sur' },
    { id: 2, nombre: 'Sindicato San Cristóbal', descripcion: 'Zona Centro' },
    { id: 3, nombre: 'Sindicato Villa Fátima', descripcion: 'Zona Este' }
  ];

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    effect(() => {
      const draft = this.routeService.activeEditDraft();
      console.log('🔄 Effect: draft cambiado:', draft);
      
      if (draft && Object.keys(draft).length > 0) {
        this.syncFromDraft(draft);
        if (this.isMapReady) {
          // 🔥 Cuando el draft cambia, renderizar pero SIN re-ajustar el zoom si estamos arrastrando
          if (!this.isDragging) {
            this.shouldFitBounds = true;
          }
          setTimeout(() => this.renderMap(), 100);
        }
      }
    });
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    console.log('🔄 RouteEditorComponent: ngOnInit');
    
    this.routeParam.params.subscribe(params => {
      const id = params['id'];
      console.log('📋 ID de la ruta desde URL:', id);
      
      if (id) {
        const route = this.routeService.routes().find(r => r.id === Number(id));
        if (route) {
          this.routeService.startEditing(route.id);
        } else {
          this.router.navigate(['/admin/routes']);
        }
      } else {
        this.routeService.startCreating();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  // ============================================================
  // 🗺️ INICIALIZAR MAPA
  // ============================================================
  private initMap() {
    if (!this.mapContainer || this.map) return;

    console.log('🗺️ Inicializando mapa editor...');
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
      console.log('🖱️ Click en mapa:', e.latlng);
      this.addPointToPolyline(e.latlng.lat, e.latlng.lng);
    });

    this.map.invalidateSize();
    this.isMapReady = true;
    console.log('✅ Mapa editor inicializado');
    
    setTimeout(() => {
      const draft = this.routeService.activeEditDraft();
      if (draft && Object.keys(draft).length > 0) {
        this.shouldFitBounds = true;
        this.renderMap();
      }
    }, 200);
  }

  // ============================================================
  // 🗺️ RENDERIZAR MAPA
  // ============================================================
  private renderMap() {
    if (!this.map || !this.isMapReady) {
      console.warn('⚠️ Mapa no inicializado');
      return;
    }

    console.log('🧹 Renderizando mapa editor...');
    this.layers.forEach(layer => layer.remove());
    this.layers = [];
    this.stopMarkers.clear();

    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) {
      console.warn('⚠️ No hay draft');
      return;
    }

    const direction = this.activeDirection();
    const polylineStr = direction === 'ida' 
      ? (draft.polylineIda || '') 
      : (draft.polylineVuelta || draft.polylineIda || '');
    
    const stops = direction === 'ida' 
      ? (draft.paradas || []) 
      : (draft.paradasVuelta || draft.paradas || []);
    
    const finalColor = this.editColor || '#3B82F6';

    console.log(`✏️ Dibujando modo edición con ${polylineStr.split(';').filter(p => p).length} coordenadas y ${stops.length} paradas`);

    const coords = this.polylineToCoordinates(polylineStr);

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
        this.isDragging = true;
        this.shouldFitBounds = false;
        const newLatLng = e.target.getLatLng();
        console.log('🔄 Punto arrastrado:', i, newLatLng);
        const updatedCoords = [...coords];
        updatedCoords[i] = [newLatLng.lat, newLatLng.lng];

        const updatedStops = stops.map(stop => {
          const isClose = Math.abs(stop.latitud - coord[0]) < 0.001 && 
                         Math.abs(stop.longitud - coord[1]) < 0.001;
          if (isClose) {
            return { ...stop, latitud: newLatLng.lat, longitud: newLatLng.lng };
          }
          return stop;
        });

        this.updatePolylineAndStops(updatedCoords, updatedStops);
        setTimeout(() => {
          this.isDragging = false;
        }, 300);
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
      const isTerminal = index === 0 || index === sortedStops.length - 1;
      const icon = this.createStopIcon(stop.orden || index + 1, true, isTerminal);
      
      const marker = L.marker([stop.latitud, stop.longitud], {
        icon,
        draggable: true
      }).addTo(this.map!);

      if (stop.id) {
        this.stopMarkers.set(stop.id, marker);
      }

      (marker as any)._stopData = stop;

      marker.on('dragend', (e: any) => {
        this.isDragging = true;
        this.shouldFitBounds = false;
        const newLatLng = e.target.getLatLng();
        const stopData = (e.target as any)._stopData;
        this.handleStopDrag(stopData, newLatLng, coords, stops);
        setTimeout(() => {
          this.isDragging = false;
        }, 300);
      });

      const terminalLabel = isTerminal ? (index === 0 ? '🏁 Inicio' : '🏁 Final') : '';
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
              ${terminalLabel ? `<p class="text-[10px] font-bold text-amber-600 m-0">${terminalLabel}</p>` : ''}
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
        this.isDragging = true;
        this.shouldFitBounds = false;
        const newLatLng = e.target.getLatLng();
        console.log('🔄 Punto medio arrastrado:', i, newLatLng);
        const updatedCoords = [...coords];
        updatedCoords.splice(i + 1, 0, [newLatLng.lat, newLatLng.lng]);

        this.updatePolylineAndStops(updatedCoords, stops);
        setTimeout(() => {
          this.isDragging = false;
        }, 300);
      });

      midMarker.bindTooltip(`➕ Estirar`, {
        direction: 'top',
        offset: [0, -5]
      });

      this.layers.push(midMarker);
    }

    // 5. Ajustar vista - SOLO si shouldFitBounds es true y NO estamos arrastrando
    if (coords.length > 0 && this.shouldFitBounds && !this.isDragging) {
      try {
        const bounds = L.latLngBounds(coords);
        this.map.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 15,
          animate: true,
          duration: 1
        });
        console.log('📍 Vista ajustada a los bounds');
      } catch (e) {
        console.warn('⚠️ No se pudo ajustar la vista:', e);
      }
      // 🔥 Después de ajustar, desactivar para que no se repita
      this.shouldFitBounds = false;
    } else {
      console.log('⏭️ Saltando ajuste de vista (isDragging:', this.isDragging, ', shouldFitBounds:', this.shouldFitBounds, ')');
    }
  }

  // ============================================================
  // 🗺️ AGREGAR PUNTO AL POLYLINE
  // ============================================================
  private addPointToPolyline(lat: number, lng: number) {
    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) return;

    const direction = this.activeDirection();
    let updatedPolyline: string;
    let updateData: Partial<Ruta> = { ...draft };
    
    if (direction === 'ida') {
      const current = this.editPolylineIda || '';
      updatedPolyline = current ? `${current};${lat},${lng}` : `${lat},${lng}`;
      updateData.polylineIda = updatedPolyline;
      this.editPolylineIda = updatedPolyline;
    } else {
      const current = this.editPolylineVuelta || '';
      updatedPolyline = current ? `${current};${lat},${lng}` : `${lat},${lng}`;
      updateData.polylineVuelta = updatedPolyline;
      this.editPolylineVuelta = updatedPolyline;
    }

    console.log(`➕ Agregando punto: ${lat},${lng}`);
    this.shouldFitBounds = true; // 🔥 Al agregar un punto, re-ajustar vista
    this.routeService.updateDraft(updateData);
  }

  // ============================================================
  // 🗺️ ACTUALIZAR POLYLINE Y PARADAS
  // ============================================================
  private updatePolylineAndStops(coords: [number, number][], stops: Parada[]) {
    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) return;

    const direction = this.activeDirection();
    const polyline = coords.map(c => `${c[0]},${c[1]}`).join(';');

    console.log(`🔄 Actualizando polyline (${coords.length} puntos) y ${stops.length} paradas`);

    const updateData: Partial<Ruta> = { ...draft };
    
    if (direction === 'ida') {
      updateData.polylineIda = polyline;
      updateData.paradas = stops;
      this.editPolylineIda = polyline;
    } else {
      updateData.polylineVuelta = polyline;
      updateData.paradasVuelta = stops;
      this.editPolylineVuelta = polyline;
    }

    this.routeService.updateDraft(updateData);
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

    this.updatePolylineAndStops(updatedCoords, updatedStops);
  }

  // ============================================================
  // 🎯 CREACIÓN DE ÍCONO DE PARADA
  // ============================================================
  private createStopIcon(sequence: number, isDraft: boolean = true, isTerminal: boolean = false): L.DivIcon {
    const size = isTerminal ? 32 : 28;
    const fontSize = isTerminal ? 12 : 11;
    const borderColor = isTerminal ? '#f59e0b' : '#64748b';
    const borderWidth = isTerminal ? '3px' : '2px';
    const iconSize = size;
    
    return L.divIcon({
      html: `
        <div class="stop-marker-wrapper" style="display:flex;align-items:center;justify-content:center;width:${iconSize}px;height:${iconSize}px;">
          <div 
            class="stop-marker-circle ${isDraft ? 'draft' : ''} ${isTerminal ? 'terminal' : ''}"
            style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: ${borderWidth} solid ${borderColor};
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
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize/2, iconSize/2]
    });
  }

  // ============================================================
  // UTILIDADES DE POLYLINE
  // ============================================================
  private polylineToCoordinates(polyline: string | undefined): [number, number][] {
    if (!polyline) return [];
    const result: [number, number][] = [];
    const parts = polyline.split(';').filter(p => p);
    for (const part of parts) {
      const [lat, lng] = part.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        result.push([lat, lng]);
      }
    }
    return result;
  }

  // ============================================================
  // SINCRONIZAR DESDE DRAFT
  // ============================================================
  private syncFromDraft(draft: Partial<Ruta>) {
    console.log('📝 Sincronizando desde draft:', draft);
    this.editNombreRuta = draft.nombreRuta || '';
    this.editCodigo = draft.codigo || '';
    this.editColor = draft.color || '#3b82f6';
    this.editTipoTransporteId = draft.tipoTransporteId || 1;
    this.editEstado = draft.estado || 'activo';
    this.editDistanciaKm = draft.distanciaKm || 0;
    this.editDuracionMin = draft.duracionMin || 0;
    this.editIntervaloMin = draft.intervaloMin || 5;
    this.editSindicatoId = draft.sindicatoId || 1;
    this.editDescripcion = '';
    this.editPolylineIda = draft.polylineIda || '';
    this.editPolylineVuelta = draft.polylineVuelta || draft.polylineIda || '';
  }

  // ============================================================
  // MANEJO DE DIRECCIÓN
  // ============================================================
  onDirectionChange(direction: 'ida' | 'vuelta') {
    console.log('🔄 Cambiando dirección a:', direction);
    this.activeDirection.set(direction);
    this.shouldFitBounds = true; // 🔥 Al cambiar dirección, re-ajustar vista
    setTimeout(() => this.renderMap(), 100);
  }

  // ============================================================
  // MANEJO DE PARADAS
  // ============================================================
  addStop() {
    if (!this.newStopName.trim()) {
      this.errorMessage = 'Ingresa un nombre de parada válido.';
      return;
    }

    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) {
      this.errorMessage = 'Primero carga una ruta';
      return;
    }

    const currentStops = this.getCurrentStops();
    const coords = this.polylineToCoordinates(this.getCurrentPolyline());
    
    let lat = -16.4985;
    let lng = -68.1365;
    
    if (coords.length > 0) {
      const lastCoord = coords[coords.length - 1];
      lat = lastCoord[0] + 0.0005;
      lng = lastCoord[1] + 0.0005;
      console.log('📍 Usando última coordenada del polyline:', lat, lng);
    } else if (this.map) {
      const center = this.map.getCenter();
      lat = center.lat;
      lng = center.lng;
      console.log('📍 Usando centro del mapa:', lat, lng);
    }

    const newStop: Parada = {
      id: Date.now() + Math.random() * 1000,
      nombre: this.newStopName.trim(),
      latitud: lat,
      longitud: lng,
      orden: currentStops.length + 1
    };

    console.log('🆕 Nueva parada creada:', newStop);

    const updatedStops = [...currentStops, newStop];
    
    const newCoord = `${lat},${lng}`;
    const currentPolyline = this.getCurrentPolyline();
    const updatedPolyline = currentPolyline ? `${currentPolyline};${newCoord}` : newCoord;
    
    console.log(`📏 Nuevo punto agregado: ${newCoord}`);
    
    const updateData: Partial<Ruta> = { ...draft };
    
    if (this.activeDirection() === 'ida') {
      updateData.polylineIda = updatedPolyline;
      updateData.paradas = updatedStops;
      this.editPolylineIda = updatedPolyline;
    } else {
      updateData.polylineVuelta = updatedPolyline;
      updateData.paradasVuelta = updatedStops;
      this.editPolylineVuelta = updatedPolyline;
    }
    
    this.shouldFitBounds = true; // 🔥 Al agregar parada, re-ajustar vista
    this.routeService.updateDraft(updateData);
    this.newStopName = '';
    this.errorMessage = '';
    console.log('✅ Parada y punto agregados correctamente');
  }

  removeStop(index: number) {
    console.log('🗑️ Eliminando parada índice:', index);
    
    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) return;
    
    const currentStops = this.getCurrentStops();
    if (currentStops.length <= 2) {
      this.errorMessage = 'La ruta debe tener al menos dos paradas.';
      return;
    }
    
    const stopToRemove = currentStops[index];
    console.log('📍 Parada a eliminar:', stopToRemove);
    
    const prevStop = index > 0 ? currentStops[index - 1] : null;
    const nextStop = index < currentStops.length - 1 ? currentStops[index + 1] : null;
    
    console.log('⬅️ Parada anterior:', prevStop);
    console.log('➡️ Parada siguiente:', nextStop);
    
    const currentPolyline = this.getCurrentPolyline();
    const coords = this.polylineToCoordinates(currentPolyline);
    console.log(`📍 Coordenadas actuales (${coords.length}):`, coords);
    
    const tolerance = 0.001;
    
    // Índice de la parada a eliminar
    let removeIndex = -1;
    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      const isClose = Math.abs(coord[0] - stopToRemove.latitud) < tolerance && 
                      Math.abs(coord[1] - stopToRemove.longitud) < tolerance;
      if (isClose) {
        removeIndex = i;
        console.log(`✅ Parada a eliminar encontrada en índice ${i}: ${coord[0]}, ${coord[1]}`);
        break;
      }
    }
    
    let prevIndex = -1;
    if (prevStop) {
      for (let i = 0; i < coords.length; i++) {
        const coord = coords[i];
        const isClose = Math.abs(coord[0] - prevStop.latitud) < tolerance && 
                        Math.abs(coord[1] - prevStop.longitud) < tolerance;
        if (isClose) {
          prevIndex = i;
          console.log(`⬅️ Parada anterior encontrada en índice ${i}: ${coord[0]}, ${coord[1]}`);
          break;
        }
      }
    }
    
    let nextIndex = -1;
    if (nextStop) {
      for (let i = 0; i < coords.length; i++) {
        const coord = coords[i];
        const isClose = Math.abs(coord[0] - nextStop.latitud) < tolerance && 
                        Math.abs(coord[1] - nextStop.longitud) < tolerance;
        if (isClose) {
          nextIndex = i;
          console.log(`➡️ Parada siguiente encontrada en índice ${i}: ${coord[0]}, ${coord[1]}`);
          break;
        }
      }
    }
    
    let startIndex = 0;
    let endIndex = coords.length - 1;
    
    if (removeIndex === -1) {
      console.warn('⚠️ No se encontró la parada en el polyline');
      let closestIndex = -1;
      let closestDistance = Infinity;
      for (let i = 0; i < coords.length; i++) {
        const coord = coords[i];
        const distance = Math.sqrt(
          Math.pow(coord[0] - stopToRemove.latitud, 2) + 
          Math.pow(coord[1] - stopToRemove.longitud, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      if (closestIndex !== -1 && closestDistance < 0.005) {
        removeIndex = closestIndex;
        console.log(`✅ Usando punto más cercano en índice ${removeIndex}`);
      } else {
        console.error('❌ No se pudo encontrar la parada en el polyline');
        return;
      }
    }
    
    if (prevIndex !== -1) {
      startIndex = prevIndex + 1;
    } else {
      startIndex = 0;
    }
    
    if (nextIndex !== -1) {
      endIndex = nextIndex - 1;
    } else {
      endIndex = coords.length - 1;
    }
    
    console.log(`📊 Puntos a eliminar: desde ${startIndex} hasta ${endIndex}`);
    console.log(`   (${endIndex - startIndex + 1} puntos)`);
    
    let updatedCoords = [...coords];
    if (startIndex <= endIndex && startIndex < updatedCoords.length && endIndex < updatedCoords.length) {
      updatedCoords.splice(startIndex, endIndex - startIndex + 1);
      console.log(`✅ Puntos eliminados. Nuevos puntos: ${updatedCoords.length}`);
    } else {
      console.warn('⚠️ No se eliminaron puntos (índices inválidos)');
    }
    
    const updatedStops = currentStops.filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, orden: i + 1 }));
    
    const updatedPolyline = updatedCoords.map(c => `${c[0]},${c[1]}`).join(';');
    console.log(`📏 Nuevo polyline: ${updatedPolyline}`);
    
    const updateData: Partial<Ruta> = { ...draft };
    
    if (this.activeDirection() === 'ida') {
      updateData.polylineIda = updatedPolyline;
      updateData.paradas = updatedStops;
      this.editPolylineIda = updatedPolyline;
    } else {
      updateData.polylineVuelta = updatedPolyline;
      updateData.paradasVuelta = updatedStops;
      this.editPolylineVuelta = updatedPolyline;
    }
    
    this.shouldFitBounds = true; // 🔥 Al eliminar parada, re-ajustar vista
    this.routeService.updateDraft(updateData);
    console.log('✅ Parada y puntos intermedios eliminados correctamente');
  }

  public getCurrentStops(): Parada[] {
    const draft = this.routeService.activeEditDraft();
    if (!draft || Object.keys(draft).length === 0) return [];
    
    if (this.activeDirection() === 'ida') {
      return draft.paradas || [];
    } else {
      return draft.paradasVuelta || draft.paradas || [];
    }
  }

  // ============================================================
  // MANEJO DE POLYLINES
  // ============================================================
  getCurrentPolyline(): string {
    if (this.activeDirection() === 'ida') {
      return this.editPolylineIda;
    } else {
      return this.editPolylineVuelta;
    }
  }

  getCoordinatesCount(): number {
    const polyline = this.getCurrentPolyline();
    if (!polyline) return 0;
    return polyline.split(';').filter(p => p).length;
  }

  undoLastCoordinate() {
    const polyline = this.getCurrentPolyline();
    if (!polyline) return;
    
    const coords = polyline.split(';');
    coords.pop();
    const newPolyline = coords.join(';');
    
    const draft = this.routeService.activeEditDraft();
    if (!draft) return;
    
    const updateData: Partial<Ruta> = { ...draft };
    
    if (this.activeDirection() === 'ida') {
      updateData.polylineIda = newPolyline;
      this.editPolylineIda = newPolyline;
    } else {
      updateData.polylineVuelta = newPolyline;
      this.editPolylineVuelta = newPolyline;
    }
    
    this.shouldFitBounds = true; // 🔥 Al deshacer, re-ajustar vista
    this.routeService.updateDraft(updateData);
    this.onFieldChange();
  }

  // ============================================================
  // FUNCIONES DE COPIA
  // ============================================================
  copyFromIda() {
    const draft = this.routeService.activeEditDraft();
    if (!draft) return;
    
    const updateData: Partial<Ruta> = {
      ...draft,
      paradasVuelta: [...(draft.paradas || [])].map(s => ({
        ...s,
        id: Date.now() + Math.random() * 1000
      })),
      polylineVuelta: draft.polylineIda || ''
    };
    this.shouldFitBounds = true; // 🔥 Al copiar, re-ajustar vista
    this.routeService.updateDraft(updateData);
  }

  invertFromIda() {
    const draft = this.routeService.activeEditDraft();
    if (!draft) return;
    
    const stops = [...(draft.paradas || [])].reverse()
      .map((s, i) => ({ ...s, id: Date.now() + Math.random() * 1000, orden: i + 1 }));
    
    const polyline = draft.polylineIda || '';
    const invertedPolyline = polyline.split(';').reverse().join(';');
    
    const updateData: Partial<Ruta> = {
      ...draft,
      paradasVuelta: stops,
      polylineVuelta: invertedPolyline
    };
    this.shouldFitBounds = true; // 🔥 Al invertir, re-ajustar vista
    this.routeService.updateDraft(updateData);
  }

  // ============================================================
  // RUTA DEMO
  // ============================================================
  loadDemoRoute() {
    const demoCoords = [
      '-16.5020,-68.1310',
      '-16.4996,-68.1344',
      '-16.4975,-68.1360',
      '-16.4952,-68.1370'
    ].join(';');

    const demoStops: Parada[] = [
      { id: Date.now(), nombre: 'Plaza del Estudiante', latitud: -16.5020, longitud: -68.1310, orden: 1 },
      { id: Date.now() + 1, nombre: 'El Prado Centro', latitud: -16.4996, longitud: -68.1344, orden: 2 },
      { id: Date.now() + 2, nombre: 'Paradero Pérez Velasco', latitud: -16.4952, longitud: -68.1370, orden: 3 }
    ];

    const draft: Partial<Ruta> = {
      id: Date.now(),
      nombreRuta: 'Trufi Express 40',
      codigo: '40',
      color: '#3b82f6',
      polylineIda: demoCoords,
      paradas: demoStops,
      distanciaKm: 3.5,
      duracionMin: 12,
      intervaloMin: 4,
      sindicatoId: 2,
      tipoTransporteId: 1,
      estado: 'activo',
      versionActual: 1
    };
    
    this.shouldFitBounds = true; // 🔥 Al cargar demo, re-ajustar vista
    this.routeService.updateDraft(draft);
    this.editColor = '#3b82f6';
  }

  // ============================================================
  // MANEJO DE CAMBIOS
  // ============================================================
  onFieldChange() {
    const draft = this.routeService.activeEditDraft();
    if (!draft) return;
    
    const updateData: Partial<Ruta> = {
      ...draft,
      nombreRuta: this.editNombreRuta,
      codigo: this.editCodigo,
      color: this.editColor,
      tipoTransporteId: this.editTipoTransporteId,
      estado: this.editEstado,
      distanciaKm: this.editDistanciaKm,
      duracionMin: this.editDuracionMin,
      intervaloMin: this.editIntervaloMin,
      sindicatoId: this.editSindicatoId,
      polylineIda: this.editPolylineIda,
      polylineVuelta: this.editPolylineVuelta
    };
    
    this.routeService.updateDraft(updateData);
  }

  onColorChange(color: string) {
    this.editColor = color;
    this.onFieldChange();
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

  // ============================================================
  // VALIDACIÓN Y GUARDADO
  // ============================================================
  isValid(): boolean {
    if (this.editNombreRuta.trim().length === 0) return false;
    if (this.editCodigo.trim().length === 0) return false;
    if (this.getCoordinatesCount() < 2) return false;
    if (this.editDistanciaKm <= 0) return false;
    return true;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (this.editNombreRuta.trim().length === 0) {
      errors.push('El nombre de la ruta es obligatorio');
    }
    if (this.editCodigo.trim().length === 0) {
      errors.push('El código es obligatorio');
    }
    if (this.editDistanciaKm <= 0) {
      errors.push('La distancia debe ser mayor a 0 km');
    }
    return errors;
  }

  saveDraft() {
    if (!this.isValid()) return;

    const draft = this.routeService.activeEditDraft();
    const now = new Date().toISOString();

    const route: Ruta = {
      id: draft?.id || Date.now(),
      sindicatoId: this.editSindicatoId,
      tipoTransporteId: this.editTipoTransporteId,
      codigo: this.editCodigo,
      nombreRuta: this.editNombreRuta,
      color: this.editColor,
      polylineIda: this.editPolylineIda,
      polylineVuelta: this.editPolylineVuelta,
      distanciaKm: this.editDistanciaKm,
      duracionMin: this.editDuracionMin,
      intervaloMin: this.editIntervaloMin,
      estado: this.editEstado,
      numeroParadas: (draft?.paradas || []).length,
      paradas: draft?.paradas || [],
      paradasVuelta: draft?.paradasVuelta || [],
      createdAt: draft?.createdAt || now,
      updatedAt: now,
      versionActual: draft?.versionActual || 1
    };

    this.routeService.saveRoute(route);
    this.gamification.triggerExpGain(4, 'Ruta creada/actualizada');
    this.router.navigate(['/admin/routes']);
  }

  onCancel() {
    this.router.navigate(['/admin/routes']);
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'activo': 'Activo',
      'mantenimiento': 'Mantenimiento',
      'suspendido': 'Suspendido'
    };
    return labels[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'activo': 'estado-activo',
      'mantenimiento': 'estado-mantenimiento',
      'suspendido': 'estado-suspendido'
    };
    return classes[estado] || '';
  }

  getTipoTransporteNombre(id: number): string {
    const found = this.tiposTransporte.find(t => t.id === id);
    return found ? `${found.icon} ${found.nombre}` : `Tipo ${id}`;
  }

  getSindicatoNombre(id: number): string {
    const found = this.sindicatos.find(s => s.id === id);
    return found ? found.nombre : `Sindicato ${id}`;
  }

  getHeaderGradient(color: string): string {
    if (!color) return 'linear-gradient(135deg, #1e293b, #0f172a)';
    return `linear-gradient(135deg, ${color}, ${color}cc)`;
  }

  get stopsCount(): number {
    return this.getCurrentStops().length;
  }
}