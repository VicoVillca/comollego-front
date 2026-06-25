import { Component, input, output, inject, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
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
export class RouteEditorComponent implements OnInit {
  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  route = input<Ruta | null>(null);
  activeEditDraft = input.required<Partial<Ruta>>();
  save = output<Ruta>();
  cancel = output<void>();
  updateActiveDraft = output<Partial<Ruta>>();
  
  // 🔥 NUEVO: OUTPUT para enviar datos al mapa
  mapDataChanged = output<{ polyline: string; stops: Parada[]; color: string }>();

  directionChanged = output<'ida' | 'vuelta'>(); // ✅ NUEVO

  // ============================================================
  // INYECCIONES
  // ============================================================
  readonly gamification = inject(GamificationService);
  readonly routeService = inject(RouteService);

  // ============================================================
  // 🆕 TABS
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
    '#E53935', // 🔴 Rojo (Línea Roja)
    '#FDD835', // 🟡 Amarillo (Línea Amarilla)
    '#43A047', // 🟢 Verde (Línea Verde)
    '#1E88E5', // 🔵 Azul (Línea Azul)
    '#FB8C00', // 🟠 Naranja (Línea Naranja)
    '#CFD8DC', // ⚪ Blanco (Línea Blanca) - gris muy clarito para visibilidad
    '#00ACC1', // 🔷 Celeste (Línea Celeste)
    '#8E24AA', // 🟣 Morado (Línea Morada)
    '#6D4C41', // 🟤 Marrón/Café (Línea Café)
    '#78909C', // 🔘 Plateado (Línea Plateada)
    '#D81B60', // 🩷 Rosa (extra - para rutas adicionales)
    '#00897B'  // 🟢 Verde azulado (extra - para rutas adicionales)
  ];

  sindicatos = [
    { id: 1, nombre: 'Sindicato Litoral', descripcion: 'Zona Sur' },
    { id: 2, nombre: 'Sindicato San Cristóbal', descripcion: 'Zona Centro' },
    { id: 3, nombre: 'Sindicato Villa Fátima', descripcion: 'Zona Este' }
  ];

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.loadDraft();
  }

  constructor() {
    effect(() => {
      const draft = this.activeEditDraft();
      if (draft) {
        this.syncFromDraft(draft);
        // 🔥 NUEVO: Emitir datos al mapa cuando cambia el draft
        this.emitMapData();
      }
    });
  }

  // ============================================================
  // MÉTODOS DE CARGA / SINCRONIZACIÓN
  // ============================================================
  private loadDraft() {
    const draft = this.activeEditDraft();
    if (draft) {
      this.syncFromDraft(draft);
    }
  }

  private syncFromDraft(draft: Partial<Ruta>) {
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
  setDirection(direction: 'ida' | 'vuelta') {
    this.saveCurrentDirectionData();
    this.activeDirection.set(direction);
    this.loadDirectionData();
  }

  private saveCurrentDirectionData() {
    const draft = this.activeEditDraft();
    if (!draft) return;
    
    if (this.activeDirection() === 'ida') {
      this.editPolylineIda = this.getCurrentPolyline();
    } else {
      this.editPolylineVuelta = this.getCurrentPolyline();
    }
  }

  private loadDirectionData() {
    const draft = this.activeEditDraft();
    if (!draft) return;
    
    if (this.activeDirection() === 'ida') {
      this.editPolylineIda = draft.polylineIda || '';
    } else {
      this.editPolylineVuelta = draft.polylineVuelta || draft.polylineIda || '';
    }
  }

  // ============================================================
  // 🔥 NUEVO: EMITIR DATOS AL MAPA
  // ============================================================
  private emitMapData() {
    const draft = this.activeEditDraft();
    const direction = this.activeDirection();
    
    if (!draft) return;
    
    // Obtener polyline según dirección
    const polyline = direction === 'ida' 
      ? (draft.polylineIda || '') 
      : (draft.polylineVuelta || draft.polylineIda || '');
    
    // Obtener paradas según dirección
    const stops = direction === 'ida' 
      ? (draft.paradas || []) 
      : (draft.paradasVuelta || draft.paradas || []);
    
    // Emitir al mapa
    this.mapDataChanged.emit({
      polyline: polyline,
      stops: stops,
      color: this.editColor || '#3B82F6'
    });
  }

  // ============================================================
  // 🔥 NUEVO: MÉTODO PARA CAMBIAR DIRECCIÓN (como en route-details)
  // ============================================================
  onDirectionChange(direction: 'ida' | 'vuelta') {
    // Guardar datos de la dirección actual antes de cambiar
    this.saveCurrentDirectionData();
    
    // Cambiar la dirección
    this.activeDirection.set(direction);
    
    // Cargar datos de la nueva dirección
    this.loadDirectionData();
    
    // Emitir al mapa
    this.emitMapData();

    this.directionChanged.emit(direction);
  }

  // ============================================================
  // MANEJO DE CAMBIOS
  // ============================================================
  onFieldChange() {
    const draft = this.activeEditDraft();
    
    this.updateActiveDraft.emit({
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
    });
    
    // 🔥 NUEVO: Emitir al mapa cuando cambia algún campo
    this.emitMapData();
  }

  onColorChange(color: string) {
    this.editColor = color;
    this.onFieldChange();
  }

  // ============================================================
  // MANEJO DE PARADAS
  // ============================================================
addStop() {
  if (!this.newStopName.trim()) {
    this.errorMessage = 'Ingresa un nombre de parada válido.';
    return;
  }

  const draft = this.activeEditDraft();
  const updateData: Partial<Ruta> = { ...draft };

  const currentStops = this.getCurrentStops();
  const coords = this.getCurrentCoordinates();
  
  // 🔥 Obtener la última coordenada para posicionar la nueva parada
  let lat = -16.5000;
  let lng = -68.1300;
  
  if (coords.length > 0) {
    const lastCoord = coords[coords.length - 1];
    lat = lastCoord[0] + 0.0005;
    lng = lastCoord[1] + 0.0005;
  } else if (currentStops.length > 0) {
    const lastStop = currentStops[currentStops.length - 1];
    lat = lastStop.latitud + 0.0005;
    lng = lastStop.longitud + 0.0005;
  }

  const newStop: Parada = {
    id: Date.now() + Math.random() * 1000,
    nombre: this.newStopName.trim(),
    latitud: lat,
    longitud: lng,
    orden: currentStops.length + 1
  };

  // 🔥 Agregar la parada a la lista
  const updatedStops = [...currentStops, newStop];
  
  // 🔥 AGREGAR EL NUEVO PUNTO AL POLYLINE EXISTENTE
  const newCoord = `${lat},${lng}`;
  const currentPolyline = this.getCurrentPolyline();

  console.log('Adding new stop:', newStop);
  console.log('Current polyline:', currentPolyline);
  console.log('New coordinate:', newCoord);
  
  // 🔥 Si el polyline existe, agregar el punto; si no, crearlo
  var updatedPolyline = currentPolyline ? `${currentPolyline};${newCoord}` : newCoord;

  console.log('Current polyline2:', updatedPolyline);
  
  updatedPolyline = this.cleanPolylineExtremes(updatedPolyline, updatedStops);
  // Actualizar según dirección
  if (this.activeDirection() === 'ida') {
    this.editPolylineIda = updatedPolyline;
    updateData.paradas = updatedStops;
    updateData.polylineIda = updatedPolyline;
  } else {
    this.editPolylineVuelta = updatedPolyline;
    updateData.paradasVuelta = updatedStops;
    updateData.polylineVuelta = updatedPolyline;
  }
  
  this.updateStops(updatedStops);
  this.newStopName = '';
  this.errorMessage = '';

  this.updateActiveDraft.emit(updateData);
  
  // Emitir al mapa
  this.emitMapData();
}
removeStop(index: number) {
  const currentStops = this.getCurrentStops();
  if (currentStops.length <= 2) {
    this.errorMessage = 'La ruta debe tener al menos dos paradas.';
    return;
  }
  
  const stopToRemove = currentStops[index];
  const coords = this.getCurrentCoordinates();
  
  // 🔥 Eliminar la parada
  const updatedStops = currentStops.filter((_, i) => i !== index)
    .map((s, i) => ({ ...s, orden: i + 1 }));
  
  // 🔥 Eliminar el punto del polyline con las mismas coordenadas
  const updatedCoords = coords.filter(
    coord => !(coord[0] === stopToRemove.latitud && coord[1] === stopToRemove.longitud)
  );
  var updatedPolyline = updatedCoords.map(c => `${c[0]},${c[1]}`).join(';');
  
  // 🔥 ACTUALIZAR VARIABLES LOCALES
  if (this.activeDirection() === 'ida') {
    this.editPolylineIda = updatedPolyline;
  } else {
    this.editPolylineVuelta = updatedPolyline;
  }
  
  // 🔥 ACTUALIZAR EL DRAFT (como en addStop)
  const draft = this.activeEditDraft();
  const updateData: Partial<Ruta> = { ...draft };
  updatedPolyline = this.cleanPolylineExtremes(updatedPolyline, updatedStops);
  
  if (this.activeDirection() === 'ida') {
    updateData.paradas = updatedStops;
    updateData.polylineIda = updatedPolyline;
  } else {
    updateData.paradasVuelta = updatedStops;
    updateData.polylineVuelta = updatedPolyline;
  }
  
  // 🔥 EMITIR AL DRAFT
  this.updateActiveDraft.emit(updateData);
  
  // 🔥 EMITIR AL MAPA
  this.emitMapData();
}


/**
 * Limpia los extremos del polyline comparando strings directamente
 * @param polyline - String del polyline "lat,lng;lat,lng;..."
 * @param stops - Array de paradas
 * @returns Polyline limpio sin puntos extra en los extremos
 */
cleanPolylineExtremes(polyline: string, stops: Parada[]): string {
  if (!polyline || stops.length === 0) return polyline;
  
  // 🔥 Convertir polyline a array de strings "lat,lng"
  const coords = polyline.split(';').filter(p => p);
  if (coords.length === 0) return polyline;
  
  // 🔥 Obtener coordenadas de primera y última parada como strings
  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const firstStopStr = `${firstStop.latitud},${firstStop.longitud}`;
  const lastStopStr = `${lastStop.latitud},${lastStop.longitud}`;
  
  // 🔥 Encontrar índice de la primera parada
  let startIndex = 0;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i] === firstStopStr) {
      startIndex = i;
      break;
    }
  }
  
  // 🔥 Encontrar índice de la última parada
  let endIndex = coords.length - 1;
  for (let i = coords.length - 1; i >= 0; i--) {
    if (coords[i] === lastStopStr) {
      endIndex = i;
      break;
    }
  }
  
  if (startIndex > endIndex) {
    console.warn('⚠️ Primera parada está después de la última parada en el polyline');
    return polyline;
  }
  
  // 🔥 Extraer solo los puntos entre startIndex y endIndex
  const cleanedCoords = coords.slice(startIndex, endIndex + 1);
  
  console.log(`🧹 Limpiando extremos del polyline:`);
  console.log(`   Puntos originales: ${coords.length}`);
  console.log(`   Puntos limpios: ${cleanedCoords.length}`);
  console.log(`   Eliminados al inicio: ${startIndex}`);
  console.log(`   Eliminados al final: ${coords.length - endIndex - 1}`);
  
  // 🔥 Devolver como string (join con ;)
  return cleanedCoords.join(';');
}

  public getCurrentStops(): Parada[] {
    const draft = this.activeEditDraft();
    if (this.activeDirection() === 'ida') {
      return draft.paradas || [];
    } else {
      return draft.paradasVuelta || draft.paradas || [];
    }
  }

  private getCurrentCoordinates(): [number, number][] {
    const draft = this.activeEditDraft();
    const polylineStr = this.activeDirection() === 'ida' 
      ? (draft.polylineIda || '') 
      : (draft.polylineVuelta || draft.polylineIda || '');
    
    if (!polylineStr) return [];
    return polylineStr.split(';').map(pair => {
      const [lat, lng] = pair.split(',').map(Number);
      return [lat, lng];
    });
  }

private updateStops(stops: Parada[]) {
  const draft = this.activeEditDraft();
  const updateData: Partial<Ruta> = { ...draft };

  
  if (this.activeDirection() === 'ida') {
    updateData.paradas = stops;
    //updateData.polylineIda = polylineCoords;
  } else {
    updateData.paradasVuelta = stops;
    //updateData.polylineVuelta = polylineCoords;
  }
  
  this.updateActiveDraft.emit(updateData);
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
    return polyline.split(';').length;
  }

  undoLastCoordinate() {
    const polyline = this.getCurrentPolyline();
    if (!polyline) return;
    
    const coords = polyline.split(';');
    coords.pop();
    const newPolyline = coords.join(';');
    
    if (this.activeDirection() === 'ida') {
      this.editPolylineIda = newPolyline;
    } else {
      this.editPolylineVuelta = newPolyline;
    }
    this.onFieldChange();
  }

  // ============================================================
  // FUNCIONES DE COPIA
  // ============================================================
  copyFromIda() {
    const draft = this.activeEditDraft();
    this.updateActiveDraft.emit({
      ...draft,
      paradasVuelta: [...(draft.paradas || [])].map(s => ({
        ...s,
        id: Date.now() + Math.random() * 1000
      })),
      polylineVuelta: draft.polylineIda || ''
    });
    this.loadDirectionData();
    // 🔥 NUEVO: Emitir al mapa después de copiar
    this.emitMapData();
  }

  invertFromIda() {
    const draft = this.activeEditDraft();
    const stops = [...(draft.paradas || [])].reverse()
      .map((s, i) => ({ ...s, id: Date.now() + Math.random() * 1000, orden: i + 1 }));
    
    const polyline = draft.polylineIda || '';
    const invertedPolyline = polyline.split(';').reverse().join(';');
    
    this.updateActiveDraft.emit({
      ...draft,
      paradasVuelta: stops,
      polylineVuelta: invertedPolyline
    });
    this.loadDirectionData();
    // 🔥 NUEVO: Emitir al mapa después de invertir
    this.emitMapData();
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

    this.updateActiveDraft.emit({
      ...this.activeEditDraft(),
      nombreRuta: 'Trufi Express 40',
      codigo: '40',
      polylineIda: demoCoords,
      paradas: demoStops,
      distanciaKm: 3.5,
      duracionMin: 12,
      intervaloMin: 4,
      sindicatoId: 2
    });
    
    // 🔥 NUEVO: Emitir al mapa después de cargar demo
    setTimeout(() => this.emitMapData(), 100);
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

    const draft = this.activeEditDraft();
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

    this.save.emit(route);
    this.gamification.triggerExpGain(4, 'Ruta creada/actualizada');
  }

  onCancel() {
    this.cancel.emit();
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

  // ============================================================
  // MÉTODOS PARA GRADIENTE DEL HEADER
  // ============================================================

  /**
   * Genera un gradiente basado en el color de la ruta
   * Similar al que usa route-details
   */
  getHeaderGradient(color: string): string {
    if (!color) return 'linear-gradient(135deg, #1e293b, #0f172a)';
    
    const rgb = this.hexToRgb(color);
    if (!rgb) return 'linear-gradient(135deg, #1e293b, #0f172a)';
    
    return `linear-gradient(135deg, ${color}, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85))`;
  }

  /**
   * Convierte color hex a objeto RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================
  get stopsCount(): number {
    return this.getCurrentStops().length;
  }

  /**
   * Verifica si es la última parada (para el editor)
   */
  isLastStop(index: number): boolean {
    return index === this.stopsCount - 1;
  }
}