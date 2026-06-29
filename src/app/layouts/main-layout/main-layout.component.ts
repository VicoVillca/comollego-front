import { Component, inject, signal, computed, effect, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouteService } from '../../core/services/route.service';
import { GamificationService } from '../../core/services/gamification.service';
import { AuthService } from '../../core/auth/auth.service';
import { PublicMapComponent } from '../../features/public-map/public-map';
import { RouteDetailsComponent } from '../../features/routes/route-details/route-details';
import { RouteResultsComponent } from '../../features/routes/route-results/route-results.component';
import { RouteStepsComponent } from '../../features/routes/route-steps/route-steps.component';
import { AppNavigationComponent } from '../../shared/components/app-navigation/app-navigation.component';
import { Ruta, Parada } from '../../core/models/transit.models';
import { RouteSearchService, RutaResultado } from '../../core/services/route-search.service';
import { PleaceSearchComponent } from '../../features/route-search/pleace-search.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PublicMapComponent,
    RouteDetailsComponent,
    RouteResultsComponent,
    RouteStepsComponent,
    AppNavigationComponent,
    PleaceSearchComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  authService = inject(AuthService);
  routeService = inject(RouteService);
  gamificationService = inject(GamificationService);
  routeSearchService = inject(RouteSearchService);
  private router = inject(Router);

  // ============================================================
  // REFERENCIA AL COMPONENTE HIJO
  // ============================================================
  @ViewChild(PleaceSearchComponent) pleaceSearchComponent!: PleaceSearchComponent;

  // ============================================================
  // ESTADO UI
  // ============================================================
  showRouteResults = signal(false);
  showRouteSteps = signal(false);
  
  destinoPreSeleccionado = signal<{ lat: number; lng: number; nombre: string } | null>(null);
  showSearch = signal<boolean>(true);

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

  mapOrigen = signal<{ lat: number; lng: number; nombre?: string } | null>(null);
  mapDestino = signal<{ lat: number; lng: number; nombre?: string } | null>(null);
  mapRutaPolyline = signal<string>('');
  mapRutaColor = signal<string>('#3B82F6');
  mapRutaSeleccionada = signal<RutaResultado | null>(null);
  resultadosBusqueda = signal<RutaResultado[]>([]);

  // 🔥 GUARDAR LOS RESULTADOS ORIGINALES PARA VOLVER ATRÁS
  private resultadosOriginales: RutaResultado[] = [];

  // ============================================================
  // MAPA - SOLO MODO VISUALIZACIÓN
  // ============================================================
  mapMode = computed<'view' | 'edit'>(() => 'view');

  // ============================================================
  // GETTERS PARA EL TEMPLATE
  // ============================================================
  get rutaSeleccionada(): RutaResultado | null {
    return this.mapRutaSeleccionada();
  }

  get origenNombre(): string {
    return this.mapOrigen()?.nombre || '';
  }

  get destinoNombre(): string {
    return this.mapDestino()?.nombre || '';
  }

  get shouldShowRouteDetails(): boolean {
    if (this.destinoPreSeleccionado()) {
      return false;
    }
    
    if (this.showRouteResults() || this.showRouteSteps()) {
      return false;
    }
    
    const selectedRoute = this.routeService.selectedRoute();
    if (selectedRoute && !this.routeService.isEditing() && !this.routeService.isCreating()) {
      return true;
    }
    
    return false;
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    if (!this.currentUser()) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.currentUser.set(JSON.parse(userData));
      }
    }

    this.clearAllRoutes();
  }

  constructor() {
    effect(() => {
      const selectedRoute = this.routeService.selectedRoute();
      if (selectedRoute && 
          !this.routeService.isEditing() && 
          !this.routeService.isCreating() &&
          !this.destinoPreSeleccionado()) {
        this.updateMapFromRoute(selectedRoute);
      }
    });

    effect(() => {
      const rutaSeleccionada = this.mapRutaSeleccionada();
      if (!rutaSeleccionada) {
        this.mapRutaPolyline.set('');
      }
    });
  }

  // ============================================================
  // 🗺️ ACTUALIZAR MAPA DESDE RUTA
  // ============================================================
  private updateMapFromRoute(route: Ruta) {
    if (!route) return;
    
    if (this.destinoPreSeleccionado()) {
      console.log('⛔ No se actualiza el mapa porque hay un destino preseleccionado');
      return;
    }
    
    const polyline = route.polylineIda || route.polylineVuelta || '';
    const stops = route.paradas || route.paradasVuelta || [];
    const color = route.color || '#3B82F6';
    
    this.mapPolyline.set(polyline);
    this.mapStops.set(stops);
    this.mapColor.set(color);
  }

  // ============================================================
  // 🔥 MÉTODO PARA LIMPIAR TODAS LAS RUTAS
  // ============================================================
  private clearAllRoutes(): void {
    console.log('🧹 Limpiando TODAS las rutas');
    
    this.routeService.selectRoute(null);
    
    this.mapPolyline.set('');
    this.mapStops.set([]);
    this.mapColor.set('#3B82F6');
    this.mapRutaSeleccionada.set(null);
    this.mapRutaPolyline.set('');
    this.mapRutaColor.set('#3B82F6');
    this.resultadosBusqueda.set([]);
    this.resultadosOriginales = [];
    this.showRouteResults.set(false);
    this.showRouteSteps.set(false);
  }

  // ============================================================
  // MANEJADORES DE EVENTOS DEL MAPA
  // ============================================================
  handleMapDataFromDetails(data: { polyline: string; stops: Parada[]; color: string }) {
    console.log('📦 Datos recibidos de detalles:', data);
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
    this.mapColor.set(data.color);
  }

  onDirectionChanged(direction: 'ida' | 'vuelta') {
    console.log('🔄 Dirección cambiada a:', direction);
    const selectedRoute = this.routeService.selectedRoute();
    if (selectedRoute) {
      const polyline = direction === 'ida' 
        ? selectedRoute.polylineIda 
        : (selectedRoute.polylineVuelta || selectedRoute.polylineIda);
      const stops = direction === 'ida' 
        ? (selectedRoute.paradas || []) 
        : (selectedRoute.paradasVuelta || selectedRoute.paradas || []);
      
      this.mapPolyline.set(polyline || '');
      this.mapStops.set(stops);
    }
  }

  handleStopClick(stop: Parada) {
    console.log('🖱️ Click en parada:', stop.nombre);
    this.gamificationService.notification.set(`📍 Parada: ${stop.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  handleMapClick(lat: number, lng: number) {
    console.log('🖱️ Click en mapa:', lat, lng);
  }

  // ============================================================
  // 🔥 MANEJADORES DE EVENTOS DEL PLEACE-SEARCH
  // ============================================================
  
  onDestinoSeleccionado(destino: { lat: number; lng: number; nombre: string }) {
    console.log('📍 Destino seleccionado:', destino);
    this.clearAllRoutes();
    this.destinoPreSeleccionado.set(destino);
    this.mapDestino.set(destino);
  }

  onOrigenSeleccionado(origen: { lat: number; lng: number; nombre: string }) {
    console.log('🟢 Origen seleccionado:', origen);
    this.clearAllRoutes();
    this.mapOrigen.set(origen);
  }

  onBuscarRutas(event: {
    origen: { lat: number; lng: number; nombre: string };
    destino: { lat: number; lng: number; nombre: string };
  }) {
    console.log('🔍 Buscando rutas');
    this.clearAllRoutes();
    
    this.gamificationService.notification.set('🔍 Buscando rutas...');
    
    this.routeSearchService.buscarRutas({
      origenLat: event.origen.lat,
      origenLng: event.origen.lng,
      destinoLat: event.destino.lat,
      destinoLng: event.destino.lng
    }).subscribe({
      next: (response) => {
        console.log('📋 Resultados obtenidos:', response.resultados.length);
        // 🔥 GUARDAR LOS RESULTADOS ORIGINALES
        this.resultadosOriginales = response.resultados;
        this.resultadosBusqueda.set(response.resultados);
        this.showRouteResults.set(true);
        if (response.resultados.length === 0) {
          this.gamificationService.notification.set('❌ No se encontraron rutas');
        } else {
          this.gamificationService.notification.set(`✅ ${response.resultados.length} rutas encontradas`);
        }
        setTimeout(() => this.gamificationService.notification.set(''), 3000);
      },
      error: (error) => {
        console.error('❌ Error al buscar rutas:', error);
        this.gamificationService.notification.set('❌ Error al buscar rutas');
        setTimeout(() => this.gamificationService.notification.set(''), 3000);
      }
    });
  }

  onClearLocation() {
    this.clearSelectedLocation();
  }

  onToggleSearch(show: boolean): void {
    console.log('🔄 Toggle search:', show);
    this.showSearch.set(show);
  }

  // ============================================================
  // 🔥 MÉTODOS DE LIMPIEZA
  // ============================================================
  
  clearSelectedLocation() {
    console.log('🧹 Limpiando selección completa');
    this.clearAllRoutes();
    this.destinoPreSeleccionado.set(null);
    this.mapDestino.set(null);
    this.mapOrigen.set(null);
    this.gamificationService.notification.set('📍 Lugar removido');
    setTimeout(() => this.gamificationService.notification.set(''), 2000);
    this.showSearch.set(true);
  }

  // ============================================================
  // 🔥 MANEJAR SELECCIÓN DE RUTA
  // ============================================================
  handleSelectRoute(resultado: RutaResultado) {
    console.log('🗺️ Ruta seleccionada:', resultado.nombre);
    
    // 🔥 Guardar la ruta seleccionada pero NO limpiar los resultados originales
    this.mapRutaSeleccionada.set(resultado);
    this.mapRutaPolyline.set(resultado.polylineIda);
    this.mapRutaColor.set(resultado.color);
    this.showRouteResults.set(false);
    this.showRouteSteps.set(true);
    this.gamificationService.notification.set(`🗺️ Ruta seleccionada: ${resultado.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // 🔥 MANEJAR PASOS
  // ============================================================
  handleBackFromSteps() {
    console.log('🔙 Volviendo atrás desde pasos');
    this.showRouteSteps.set(false);
    this.resultadosBusqueda.set(this.resultadosOriginales);
    this.showRouteResults.set(true);

    
    // Limpiar el polyline de la ruta seleccionada
    this.mapRutaPolyline.set('');
    this.mapRutaColor.set('');
    this.mapRutaSeleccionada.set(null);
  }

  handleShowInMap() {
    this.showRouteSteps.set(false);
    this.gamificationService.notification.set('🗺️ Ruta mostrada en el mapa');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // 🔥 CERRAR RESULTADOS CON X
  // ============================================================
  cerrarResultadosConX() {
    console.log('❌ Cerrando resultados con X');
    this.clearAllRoutes();
    this.mapOrigen.set(null);
    this.mapDestino.set(null);
    this.destinoPreSeleccionado.set(null);
    
    if (this.pleaceSearchComponent) {
      this.pleaceSearchComponent.clearAllState();
    }
    
    this.gamificationService.notification.set('🗺️ Buscador reiniciado');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.showSearch.set(true);
  }

  handleCloseRuta() {
    console.log('❌ Cerrando ruta seleccionada');
    this.clearAllRoutes();
    this.mapOrigen.set(null);
    this.mapDestino.set(null);
    this.destinoPreSeleccionado.set(null);
    
    if (this.pleaceSearchComponent) {
      this.pleaceSearchComponent.clearAllState();
    }
    
    this.gamificationService.notification.set('🗺️ Ruta cerrada');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // 🔐 IR AL ADMIN
  // ============================================================
  goToAdmin() {
    const user = this.authService.currentUser();
    const userRole = (user as any)?.role || 'USER';
    
    if (userRole === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/login']);
      this.gamificationService.notification.set('🔐 Acceso solo para administradores');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }
  }

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