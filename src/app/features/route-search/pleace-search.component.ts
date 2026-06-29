import { Component, signal, inject, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LugarService } from '../lugares/lugar.service';
import { RouteSearchService } from '../../core/services/route-search.service';
import { GamificationService } from '../../core/services/gamification.service';
import { Lugar } from '../../core/models/transit.models';

@Component({
  selector: 'app-pleace-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './pleace-search.component.html',
  styleUrls: ['./pleace-search.component.css']
})
export class PleaceSearchComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  private lugarService = inject(LugarService);
  private routeSearchService = inject(RouteSearchService);
  private gamificationService = inject(GamificationService);

  // ============================================================
  // INPUTS
  // ============================================================
  destinoPreSeleccionado = input<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // OUTPUTS
  // ============================================================
  onDestinoSeleccionado = output<{ lat: number; lng: number; nombre: string }>();
  onOrigenSeleccionado = output<{ lat: number; lng: number; nombre: string }>();
  onBuscarRutas = output<{
    origen: { lat: number; lng: number; nombre: string };
    destino: { lat: number; lng: number; nombre: string };
  }>();
  onClearLocation = output<void>();
  onToggleSearch = output<boolean>();

  // ============================================================
  // ESTADO UI
  // ============================================================
  showLugarSuggestions = signal(false);
  showSearch = signal<boolean>(true);

  // ============================================================
  // BUSCADOR DE LUGARES (destino)
  // ============================================================
  lugarSearchText = signal('');
  lugares = signal<Lugar[]>([]);
  isLoadingLugares = signal(false);
  lugarSearchError = signal<string | null>(null);

  // ============================================================
  // ORIGEN
  // ============================================================
  origenSearchText = signal('');
  sugerenciasOrigen = signal<Lugar[]>([]);
  isLoadingOrigen = signal(false);
  origenSeleccionado = signal<{ lat: number; lng: number; nombre: string } | null>(null);
  destinoSeleccionadoEnBuscador = signal<{ lat: number; lng: number; nombre: string } | null>(null);
  selectedLocation = signal<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    // Si hay destino preseleccionado desde el padre, sincronizar
    if (this.destinoPreSeleccionado()) {
      this.destinoSeleccionadoEnBuscador.set(this.destinoPreSeleccionado());
      this.selectedLocation.set(this.destinoPreSeleccionado());
    }
  }

  // ============================================================
  // MÉTODOS DE TOGGLE
  // ============================================================
  toggleSearch(): void {
    this.showSearch.update(value => !value);
    this.onToggleSearch.emit(this.showSearch());
  }

  esMovile(): boolean {
    return window.innerWidth <= 768;
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
  selectLugar(lugar: Lugar) {
    const destino = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.destinoSeleccionadoEnBuscador.set(destino);
    this.selectedLocation.set(destino);
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    
    this.gamificationService.notification.set(`🔴 Destino: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    
    // Notificar al padre
    this.onDestinoSeleccionado.emit(destino);
    
    // Verificar si debe mostrar versión resumida
    this.checkMobileSearch();
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
    const origen = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.origenSeleccionado.set(origen);
    this.origenSearchText.set(lugar.nombre);
    this.sugerenciasOrigen.set([]);
    
    this.gamificationService.notification.set(`🟢 Origen: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);

    // Notificar al padre
    this.onOrigenSeleccionado.emit(origen);
    
    // Buscar rutas
    this.buscarRutas();
    
    // Verificar si debe mostrar versión resumida
    this.checkMobileSearch();
  }

  limpiarOrigen() {
    this.origenSeleccionado.set(null);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    this.showSearch.set(true);
    this.onToggleSearch.emit(true);
  }

  usarGPSorigen() {
    this.gamificationService.notification.set('📍 Obteniendo ubicación...');
    
    this.routeSearchService.getCurrentPosition().then(position => {
      const location = {
        lat: position.lat,
        lng: position.lng,
        nombre: '📍 Mi ubicación'
      };
      this.origenSeleccionado.set(location);
      this.origenSearchText.set('📍 Mi ubicación');
      this.gamificationService.notification.set('🟢 Origen: Tu ubicación actual');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      
      // Notificar al padre
      this.onOrigenSeleccionado.emit(location);
      
      // Verificar si debe mostrar versión resumida
      this.checkMobileSearch();
      
      this.buscarRutas();
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
    const destino = this.destinoPreSeleccionado() || this.destinoSeleccionadoEnBuscador();
    
    if (!origen || !destino) {
      this.gamificationService.notification.set('⚠️ Selecciona origen y destino');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }
    
    this.onBuscarRutas.emit({ origen, destino });
  }

  // ============================================================
  // 🔥 LIMPIAR SELECCIÓN
  // ============================================================
  clearSelectedLocation() {
    this.selectedLocation.set(null);
    this.destinoSeleccionadoEnBuscador.set(null);
    this.origenSeleccionado.set(null);
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    this.showSearch.set(true);
    
    this.gamificationService.notification.set('📍 Lugar removido');
    setTimeout(() => this.gamificationService.notification.set(''), 2000);
    
    this.onClearLocation.emit();
    this.onToggleSearch.emit(true);
  }

  // ============================================================
  // 🔥 UTILIDADES
  // ============================================================
  private checkMobileSearch(): void {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.origenSeleccionado() && this.destinoPreSeleccionado()) {
      this.showSearch.set(false);
      this.onToggleSearch.emit(false);
    } else {
      this.showSearch.set(true);
      this.onToggleSearch.emit(true);
    }
  }

  truncateText(text: string | undefined, maxLength: number = 25): string {
    if (!text) return '';
    const isMobile = window.innerWidth <= 768;
    const limit = isMobile ? Math.min(maxLength, 20) : maxLength;
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  }

  clearAllState(): void {
    console.log('🧹 PeaceSearchComponent: Limpiando todo el estado');
    
    // Limpiar destino
    this.destinoSeleccionadoEnBuscador.set(null);
    this.selectedLocation.set(null);
    this.lugarSearchText.set('');
    this.lugares.set([]);
    this.showLugarSuggestions.set(false);
    this.lugarSearchError.set(null);
    
    // Limpiar origen
    this.origenSeleccionado.set(null);
    this.origenSearchText.set('');
    this.sugerenciasOrigen.set([]);
    this.isLoadingOrigen.set(false);
    
    // Resetear UI
    this.showSearch.set(true);
    this.isLoadingLugares.set(false);
    
    // Notificar al padre que se limpió
    this.onToggleSearch.emit(true);
  }
}