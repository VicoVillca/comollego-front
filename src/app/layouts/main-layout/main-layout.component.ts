import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouteService } from '../../core/services/route.service';
import { GamificationService } from '../../core/services/gamification.service';
import { AuthService } from '../../core/auth/auth.service';
import { MapComponent } from '../../features/map/map';
import { RouteDetailsComponent } from '../../features/routes/route-details/route-details';
import { RouteEditorComponent } from '../../features/routes/route-editor/route-editor';
import { Ruta, Parada, Lugar } from '../../core/models/transit.models';
import { LUGARES_MOCK } from '../../data/mock-data';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MapComponent,
    RouteDetailsComponent,
    RouteEditorComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly gamificationService = inject(GamificationService);
  readonly authService = inject(AuthService);
  private router = inject(Router);

  // ============================================================
  // ESTADO UI
  // ============================================================
  activeEditDraft = signal<Partial<Ruta>>({});
  
  // ============================================================
  // DIALOGS
  // ============================================================
  showUserDialog = signal(false);
  showLineSearch = signal(false);
  showAppDialog = signal(false);
  showDevDialog = signal(false);
  showAddLugarModal = signal(false);
  showLugarSuggestions = signal(false);
  
  // ============================================================
  // BUSCADOR DE LUGARES
  // ============================================================
  lugarSearchText = signal('');
  lugares: Lugar[] = LUGARES_MOCK;
  
  // ============================================================
  // FORMULARIO NUEVO LUGAR
  // ============================================================
  newLugarNombre = '';
  newLugarCiudad = '';
  newLugarLat = -16.5000;
  newLugarLng = -68.1300;
  newLugarDesc = '';
  
  // ============================================================
  // USUARIO ACTUAL
  // ============================================================
  currentUser = signal<any>(null);

  // ============================================================
  // 🗺️ SEÑALES PARA EL MAPA
  // ============================================================
  mapPolyline = signal<string>('');
  mapStops = signal<Parada[]>([]);
  mapColor = signal<string>('#3B82F6');

  // ============================================================
  // DIRECCIÓN ACTUAL DEL EDITOR
  // ============================================================
  editorDirection = signal<'ida' | 'vuelta'>('ida');

  mapMode = computed<'view' | 'edit'>(() => {
    if (this.routeService.isEditing() || this.routeService.isCreating()) {
      return 'edit';
    }
    return 'view';
  });

  // ============================================================
  // FILTRO DE LUGARES (para sugerencias)
  // ============================================================
  filteredLugares = computed(() => {
    const search = this.lugarSearchText().toLowerCase().trim();
    if (!search) return [];
    return this.lugares.filter(l => 
      l.nombre.toLowerCase().includes(search) || 
      l.ciudad.toLowerCase().includes(search) ||
      (l.descripcion?.toLowerCase().includes(search) ?? false)
    );
  });

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    // Cargar usuario desde el servicio
    this.currentUser.set(this.authService.currentUser());
    
    // Si no hay usuario, intentar cargar desde localStorage
    if (!this.currentUser()) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.currentUser.set(JSON.parse(userData));
      }
    }
  }

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    // Efecto para cuando se está editando o creando
    effect(() => {
      if (this.routeService.isEditing()) {
        const selected = this.routeService.selectedRoute();
        if (selected) {
          this.activeEditDraft.set({ ...selected });
          this.updateMapFromRoute(selected);
          this.editorDirection.set('ida');
        }
      } else if (this.routeService.isCreating()) {
        const newDraft: Partial<Ruta> = {
          id: Date.now(),
          nombreRuta: 'Nuevo Recorrido Colaborativo',
          color: '#0D9488',
          polylineIda: '',
          polylineVuelta: '',
          distanciaKm: 0,
          duracionMin: 0,
          intervaloMin: 5,
          estado: 'activo',
          numeroParadas: 0,
          paradas: [],
          paradasVuelta: [],
          sindicatoId: 1,
          tipoTransporteId: 1,
          versionActual: 1
        };
        this.activeEditDraft.set(newDraft);
        this.mapPolyline.set('');
        this.mapStops.set([]);
        this.mapColor.set('#0D9488');
        this.editorDirection.set('ida');
      }
    }, { allowSignalWrites: true });

    // Efecto para cuando se selecciona una ruta (sin editar)
    effect(() => {
      const selectedRoute = this.routeService.selectedRoute();
      if (selectedRoute && !this.routeService.isEditing() && !this.routeService.isCreating()) {
        this.updateMapFromRoute(selectedRoute);
      }
    });
  }

  // ============================================================
  // 🗺️ MÉTODOS PARA ACTUALIZAR EL MAPA
  // ============================================================
  private updateMapFromRoute(route: Ruta) {
    if (!route) return;
    
    const polyline = route.polylineIda || route.polylineVuelta || '';
    const stops = route.paradas || route.paradasVuelta || [];
    const color = route.color || '#3B82F6';
    
    this.mapPolyline.set(polyline);
    this.mapStops.set(stops);
    this.mapColor.set(color);
  }

  // ============================================================
  // MANEJAR DATOS DEL EDITOR
  // ============================================================
  handleMapDataFromEditor(data: { polyline: string; stops: Parada[]; color: string }) {
    console.log('📦 Datos recibidos del editor:', data);
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
    this.mapColor.set(data.color);
  }

  // ============================================================
  // MANEJAR CAMBIO DE DIRECCIÓN
  // ============================================================
  onDirectionChanged(direction: 'ida' | 'vuelta') {
    console.log('🔄 Dirección cambiada a:', direction);
    this.editorDirection.set(direction);
  }

  // ============================================================
  // MANEJAR DATOS DE ROUTE-DETAILS
  // ============================================================
  handleMapDataFromDetails(data: { polyline: string; stops: Parada[]; color: string }) {
    console.log('📦 Datos recibidos de detalles:', data);
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
    this.mapColor.set(data.color);
  }

  // ============================================================
  // EVENTOS DEL MAPA
  // ============================================================
  handleMapClick(lat: number, lng: number) {
    if (!this.routeService.isEditing() && !this.routeService.isCreating()) return;

    const draft = this.activeEditDraft();
    if (!draft) return;

    const currentDirection = this.editorDirection();
    
    const currentPolyline = currentDirection === 'ida' 
      ? (draft.polylineIda || '') 
      : (draft.polylineVuelta || '');
    
    const newCoord = `${lat},${lng}`;
    const updatedPolyline = currentPolyline ? `${currentPolyline};${newCoord}` : newCoord;

    this.activeEditDraft.update(d => {
      const update: any = { ...d };
      
      if (currentDirection === 'ida') {
        update.polylineIda = updatedPolyline;
        update.polylineVuelta = d.polylineVuelta || '';
      } else {
        update.polylineVuelta = updatedPolyline;
        update.polylineIda = d.polylineIda || '';
      }
      
      return update;
    });
    
    this.mapPolyline.set(updatedPolyline);
  }

  handleStopClick(stop: Parada) {
    console.log('🖱️ Click en parada:', stop.nombre);
    this.gamificationService.notification.set(`📍 Parada: ${stop.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  handleMapDataChanged(data: { polyline: string; stops: Parada[] }) {
    console.log('📦 Datos actualizados desde el mapa:', data);
    console.log('📍 Dirección actual del editor:', this.editorDirection());
    
    const draft = this.activeEditDraft();
    if (!draft) return;
    
    const currentDirection = this.editorDirection();
    
    this.activeEditDraft.update(d => {
      const update: any = { ...d };
      
      if (currentDirection === 'ida') {
        update.polylineIda = data.polyline;
        update.paradas = data.stops;
        update.polylineVuelta = d.polylineVuelta || '';
        update.paradasVuelta = d.paradasVuelta || [];
      } else {
        update.polylineVuelta = data.polyline;
        update.paradasVuelta = data.stops;
        update.polylineIda = d.polylineIda || '';
        update.paradas = d.paradas || [];
      }
      
      return update;
    });
    
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
  }

  // ============================================================
  // 💾 GUARDAR / CANCELAR
  // ============================================================
  handleSaveRoute(route: Ruta) {
    this.routeService.saveRoute(route);
    // Cerrar el editor después de guardar
    this.routeService.cancelEditing();
  }

  handleCancelEdit() {
    this.routeService.cancelEditing();
    this.mapPolyline.set('');
    this.mapStops.set([]);
    this.mapColor.set('#3B82F6');
    this.editorDirection.set('ida');
  }

  // ============================================================
  // BUSCADOR DE LUGARES (como Google)
  // ============================================================
  onLugarSearchChange(value: string) {
    this.lugarSearchText.set(value);
    if (value.trim().length > 0) {
      this.showLugarSuggestions.set(true);
    } else {
      this.showLugarSuggestions.set(false);
    }
  }

  clearLugarSearch() {
    this.lugarSearchText.set('');
    this.showLugarSuggestions.set(false);
  }

  onLugarBlur() {
    setTimeout(() => {
      this.showLugarSuggestions.set(false);
    }, 200);
  }

  selectLugar(lugar: Lugar) {
    console.log('📍 Lugar seleccionado:', lugar);
    this.gamificationService.notification.set(`📍 ${lugar.nombre} (${lugar.ciudad})`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.lugarSearchText.set('');
    this.showLugarSuggestions.set(false);
  }

  // ============================================================
  // DIALOGS
  // ============================================================
  toggleUserDialog() {
    this.showUserDialog.update(v => !v);
  }

  toggleLineSearch() {
    this.showLineSearch.update(v => !v);
  }

  toggleAppDialog() {
    this.showAppDialog.update(v => !v);
  }

  toggleDevDialog() {
    this.showDevDialog.update(v => !v);
  }

  // ============================================================
  // BUSCADOR DE LÍNEAS
  // ============================================================
  selectRoute(route: Ruta) {
    this.routeService.selectRoute(route.id);
    this.showLineSearch.set(false);
    this.routeService.filters.update(f => ({...f, search: ''}));
  }

  // ============================================================
  // AGREGAR LUGAR
  // ============================================================
  openAddLugarModal() {
    this.showAddLugarModal.set(true);
  }

  closeAddLugarModal() {
    this.showAddLugarModal.set(false);
    this.newLugarNombre = '';
    this.newLugarCiudad = '';
    this.newLugarLat = -16.5000;
    this.newLugarLng = -68.1300;
    this.newLugarDesc = '';
  }

  saveLugar() {
    if (!this.newLugarNombre.trim() || !this.newLugarCiudad.trim()) {
      this.gamificationService.notification.set('⚠️ Nombre y ciudad son obligatorios');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }

    const newLugar: Lugar = {
      id: Date.now() + Math.random() * 1000,
      nombre: this.newLugarNombre.trim(),
      ciudad: this.newLugarCiudad.trim(),
      latitud: this.newLugarLat || -16.5000,
      longitud: this.newLugarLng || -68.1300,
      descripcion: this.newLugarDesc.trim() || undefined
    };

    this.lugares = [newLugar, ...this.lugares];
    this.gamificationService.notification.set(`✅ Lugar "${newLugar.nombre}" agregado`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.closeAddLugarModal();
  }

  // ============================================================
  // 🔐 CERRAR SESIÓN
  // ============================================================
  logout() {
    this.authService.logout();
    this.gamificationService.notification.set('👋 Sesión cerrada');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.router.navigate(['/login']);
  }

  // ============================================================
  // 🏷️ UTILIDADES
  // ============================================================
  getTransitName(route: Ruta): string {
    if (route.tipoTransporteNombre) {
      return route.tipoTransporteNombre;
    }
    const map: Record<number, string> = {
      1: 'Minibús',
      2: 'Trufi',
      3: 'Teleférico',
      4: 'PumaKatari',
      5: 'Micro'
    };
    return map[route.tipoTransporteId] || `Tipo ${route.tipoTransporteId}`;
  }
}