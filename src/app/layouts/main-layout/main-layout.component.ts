import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouteService } from '../../core/services/route.service';
import { GamificationService } from '../../core/services/gamification.service';
import { AuthService } from '../../core/auth/auth.service';
import { LugarService } from '../../features/lugares/lugar.service';
import { PublicMapComponent } from '../../features/public-map/public-map';
import { RouteDetailsComponent } from '../../features/routes/route-details/route-details';
import { RouteResultsComponent } from '../../features/routes/route-results/route-results.component';
import { RouteStepsComponent } from '../../features/routes/route-steps/route-steps.component';
import { AppNavigationComponent } from '../../shared/components/app-navigation/app-navigation.component';
import { Ruta, Parada, Lugar } from '../../core/models/transit.models';
import { RouteSearchService, RutaResultado } from '../../core/services/route-search.service';

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
    AppNavigationComponent
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
  lugarService = inject(LugarService);
  routeSearchService = inject(RouteSearchService);
  private router = inject(Router);

  // ============================================================
  // ESTADO UI
  // ============================================================
  showLugarSuggestions = signal(false);
  showRouteResults = signal(false);
  showRouteSteps = signal(false);
  
  destinoSeleccionadoEnBuscador = signal<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // BUSCADOR DE LUGARES (destino)
  // ============================================================
  lugarSearchText = signal('');
  lugares = signal<Lugar[]>([]);
  isLoadingLugares = signal(false);
  lugarSearchError = signal<string | null>(null);

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

  // ============================================================
  // ORIGEN - variables para el panel
  // ============================================================
  origenSearchText = signal('');
  sugerenciasOrigen = signal<Lugar[]>([]);
  isLoadingOrigen = signal(false);
  origenSeleccionado = signal<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // MAPA - SOLO MODO VISUALIZACIÓN
  // ============================================================
  mapMode = computed<'view' | 'edit'>(() => 'view');

  // ============================================================
  // FILTRO DE LUGARES
  // ============================================================
  filteredLugares = computed(() => this.lugares());

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

  get destinoPreSeleccionado() {
    return this.destinoSeleccionadoEnBuscador();
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
  }

  constructor() {
    effect(() => {
      const selectedRoute = this.routeService.selectedRoute();
      if (selectedRoute && !this.routeService.isEditing() && !this.routeService.isCreating()) {
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
    
    const polyline = route.polylineIda || route.polylineVuelta || '';
    const stops = route.paradas || route.paradasVuelta || [];
    const color = route.color || '#3B82F6';
    
    this.mapPolyline.set(polyline);
    this.mapStops.set(stops);
    this.mapColor.set(color);
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
  // MANEJAR CAMBIO DE DIRECCIÓN
  // ============================================================
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

  // ============================================================
  // 🖱️ EVENTOS DEL MAPA
  // ============================================================
  handleStopClick(stop: Parada) {
    console.log('🖱️ Click en parada:', stop.nombre);
    this.gamificationService.notification.set(`📍 Parada: ${stop.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  handleMapClick(lat: number, lng: number) {
    console.log('🖱️ Click en mapa:', lat, lng);
  }

  // ============================================================
  // 🔍 BUSCADOR DE LUGARES (DESTINO)
  // ============================================================
  onLugarSearchChange(value: string) {
    this.lugarSearchText.set(value);
    
    if (value.trim().length >= 2) {
      this.isLoadingLugares.set(true);
      this.lugarSearchError.set(null);
      
      this.lugarService.buscarLugares(value).subscribe({
        next: (response) => {
          this.isLoadingLugares.set(false);
          if (response.success && response.data) {
            this.lugares.set(response.data);
            this.showLugarSuggestions.set(response.data.length > 0);
          } else {
            this.lugares.set([]);
            this.showLugarSuggestions.set(false);
            if (response.messages) {
              this.lugarSearchError.set(response.messages.join(' • '));
            }
          }
        },
        error: () => {
          this.isLoadingLugares.set(false);
          this.lugares.set([]);
          this.showLugarSuggestions.set(false);
          this.lugarSearchError.set('Error al buscar lugares');
        }
      });
    } else {
      this.lugares.set([]);
      this.showLugarSuggestions.set(false);
      this.lugarSearchError.set(null);
    }
  }

  clearLugarSearch() {
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    this.lugarSearchError.set(null);
  }

  onLugarBlur() {
    setTimeout(() => this.showLugarSuggestions.set(false), 200);
  }

  // ============================================================
  // 📍 SELECCIONAR LUGAR (DESTINO)
  // ============================================================
  selectedLocation = signal<{ lat: number; lng: number; nombre: string } | null>(null);

  selectLugar(lugar: Lugar) {
    console.log('📍 Destino seleccionado:', lugar);
    
    const destino = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.destinoSeleccionadoEnBuscador.set(destino);
    this.selectedLocation.set(destino);
    this.mapDestino.set(destino);
    
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    this.gamificationService.notification.set(`🔴 Destino: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  clearSelectedLocation() {
    this.selectedLocation.set(null);
    this.destinoSeleccionadoEnBuscador.set(null);
    this.mapDestino.set(null);
    this.mapOrigen.set(null);
    this.origenSeleccionado.set(null);
    this.mapRutaSeleccionada.set(null);
    this.mapRutaPolyline.set('');
    this.resultadosBusqueda.set([]);
    this.showRouteResults.set(false);
    this.showRouteSteps.set(false);
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    this.gamificationService.notification.set('📍 Lugar removido');
    setTimeout(() => this.gamificationService.notification.set(''), 2000);
  }

  // ============================================================
  // 🔥 ORIGEN - MÉTODOS
  // ============================================================
  onOrigenSearchChange(value: string) {
    this.origenSearchText.set(value);
    if (value.trim().length >= 2) {
      this.isLoadingOrigen.set(true);
      this.lugarService.buscarLugares(value).subscribe({
        next: (response) => {
          this.isLoadingOrigen.set(false);
          if (response.success && response.data) {
            this.sugerenciasOrigen.set(response.data);
          } else {
            this.sugerenciasOrigen.set([]);
          }
        },
        error: () => {
          this.isLoadingOrigen.set(false);
          this.sugerenciasOrigen.set([]);
        }
      });
    } else {
      this.sugerenciasOrigen.set([]);
    }
  }

  selectOrigen(lugar: Lugar) {
    console.log('🟢 Origen seleccionado:', lugar);
    
    const origen = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.origenSeleccionado.set(origen);
    this.origenSearchText.set(lugar.nombre);
    this.sugerenciasOrigen.set([]);
    this.mapOrigen.set(origen);
    this.gamificationService.notification.set(`🟢 Origen: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);

    this.buscarRutas();
  }

  limpiarOrigen() {
    this.origenSeleccionado.set(null);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    this.mapOrigen.set(null);
  }

  usarGPSorigen() {
    console.log('📍 Usando GPS para origen...');
    this.gamificationService.notification.set('📍 Obteniendo ubicación...');
    
    this.routeSearchService.getCurrentPosition().then(position => {
      const location = {
        lat: position.lat,
        lng: position.lng,
        nombre: '📍 Mi ubicación'
      };
      this.origenSeleccionado.set(location);
      this.origenSearchText.set('📍 Mi ubicación');
      this.mapOrigen.set(location);
      this.gamificationService.notification.set('🟢 Origen: Tu ubicación actual');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }).catch(error => {
      console.error('Error al obtener ubicación:', error);
      this.gamificationService.notification.set('❌ Error al obtener ubicación');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    });
  }

  seleccionarOrigenEnMapa() {
    this.gamificationService.notification.set('🗺️ Haz clic en el mapa para seleccionar ORIGEN');
    setTimeout(() => this.gamificationService.notification.set(''), 4000);
  }

  // ============================================================
  // 🔥 BUSCAR RUTAS
  // ============================================================
  buscarRutas() {
    const origen = this.origenSeleccionado();
    const destino = this.destinoPreSeleccionado;
    
    if (!origen || !destino) {
      this.gamificationService.notification.set('⚠️ Selecciona origen y destino');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }
    
    console.log('🔍 Buscando rutas desde', origen.nombre, 'hasta', destino.nombre);
    this.gamificationService.notification.set('🔍 Buscando rutas...');
    
    this.routeSearchService.buscarRutas({
      origenLat: origen.lat,
      origenLng: origen.lng,
      destinoLat: destino.lat,
      destinoLng: destino.lng
    }).subscribe({
      next: (response) => {
        console.log('📋 Resultados:', response.resultados);
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

  cerrarResultados() {
    this.showRouteResults.set(false);
  }

  abrirResultados() {
    if (this.resultadosBusqueda().length > 0) {
      this.showRouteResults.set(true);
    }
  }

  cerrarResultadosConX() {
    this.showRouteResults.set(false);
    //this.resultadosBusqueda.set([]);
    this.limpiarOrigen();
  }

  // ============================================================
  // 🔥 MANEJAR SELECCIÓN DE RUTA
  // ============================================================
  handleSelectRoute(resultado: RutaResultado) {
    console.log('🗺️ Ruta seleccionada:', resultado.nombre);
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
  handleShowSteps() {
    this.showRouteSteps.set(true);
  }

  handleCloseSteps() {
    this.showRouteSteps.set(false);
  }

  handleBackFromSteps() {
    this.showRouteSteps.set(false);
    this.showRouteResults.set(true);
    if (this.resultadosBusqueda().length > 0) {
      this.showRouteResults.set(true);
    }
  }

  handleShowInMap() {
    this.showRouteSteps.set(false);
    this.gamificationService.notification.set('🗺️ Ruta mostrada en el mapa');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // 🔥 CERRAR RUTA SELECCIONADA
  // ============================================================
  handleCloseRuta() {
    this.mapRutaSeleccionada.set(null);
    this.mapRutaPolyline.set('');
    this.mapRutaColor.set('#3B82F6');
    this.mapOrigen.set(null);
    this.mapDestino.set(null);
    this.origenSeleccionado.set(null);
    this.resultadosBusqueda.set([]);
    this.showRouteResults.set(false);
    this.showRouteSteps.set(false);
    
    this.destinoSeleccionadoEnBuscador.set(null);
    this.selectedLocation.set(null);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    
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

  // Método para truncar texto
truncateText(text: string | undefined, maxLength: number = 25): string {
  if (!text) return '';
  
  // Detectar si es móvil por el ancho de la pantalla
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  // En web/desktop mostrar el texto completo
  return text;
}
}