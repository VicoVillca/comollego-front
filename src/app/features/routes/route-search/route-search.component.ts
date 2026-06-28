import { Component, inject, signal, computed, output, input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule } from '@angular/router';
import { LugarService } from '../../lugares/lugar.service';
import { BuscarRutasRequest, RouteSearchService, RutaResultado } from '../../../core/services/route-search.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Lugar } from '../../../core/models/transit.models';

@Component({
  selector: 'app-route-search',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextModule, 
    RouterModule
  ],
  templateUrl: './route-search.component.html',
  styleUrl: './route-search.component.css'
})
export class RouteSearchComponent implements OnInit, OnDestroy {
  // ============================================================
  // SERVICIOS
  // ============================================================
  private routeSearchService = inject(RouteSearchService);
  private lugarService = inject(LugarService);
  private gamificationService = inject(GamificationService);

  // ============================================================
  // INPUTS
  // ============================================================
  destinoPreSeleccionado = input<{ lat: number; lng: number; nombre: string } | null>(null);

  // ============================================================
  // OUTPUTS
  // ============================================================
  onSearchResults = output<RutaResultado[]>();
  onSelectRoute = output<RutaResultado>();
  onClose = output<void>();
  onSelectOrigen = output<{ lat: number; lng: number; nombre?: string }>();
  onSelectDestino = output<{ lat: number; lng: number; nombre?: string }>();
  onOrigenCleared = output<void>();
  onDestinoCleared = output<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  step = signal<'destino' | 'origen' | 'resultados' | 'ruta_seleccionada'>('destino');
  
  // Campos de búsqueda
  destinoSearch = signal('');
  origenSearch = signal('');
  
  // Lugares seleccionados
  destinoSeleccionado = signal<{ lat: number; lng: number; nombre: string } | null>(null);
  origenSeleccionado = signal<{ lat: number; lng: number; nombre: string } | null>(null);
  
  // Sugerencias
  sugerenciasDestino = signal<Lugar[]>([]);
  sugerenciasOrigen = signal<Lugar[]>([]);
  isLoadingDestino = signal(false);
  isLoadingOrigen = signal(false);
  
  // Resultados
  resultados = signal<RutaResultado[]>([]);
  isLoadingResultados = signal(false);
  
  // Ruta seleccionada
  rutaSeleccionada = signal<RutaResultado | null>(null);

  // Modo selección en mapa
  modoSeleccion = signal<'origen' | 'destino' | null>(null);

  // ============================================================
  // COMPUTADAS
  // ============================================================
  showDestinoInput = computed(() => this.step() === 'destino');
  showOrigenInput = computed(() => this.step() === 'origen');
  showResultados = computed(() => this.step() === 'resultados');
  showRutaSeleccionada = computed(() => this.step() === 'ruta_seleccionada');

  hasDestino = computed(() => !!this.destinoSeleccionado());
  hasOrigen = computed(() => !!this.origenSeleccionado());
  hasResultados = computed(() => this.resultados().length > 0);

  // ============================================================
  // GETTERS
  // ============================================================
  get origenLabel(): string {
    const origen = this.origenSeleccionado();
    return origen?.nombre || 'Seleccionar origen';
  }

  get destinoLabel(): string {
    const destino = this.destinoSeleccionado();
    return destino?.nombre || 'Seleccionar destino';
  }

  get resultadosCount(): number {
    return this.resultados().length;
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    console.log('🔄 RouteSearchComponent: ngOnInit');
    
    const destino = this.destinoPreSeleccionado();
    if (destino) {
      console.log('📍 Destino pre-seleccionado:', destino);
      this.destinoSeleccionado.set(destino);
      this.destinoSearch.set(destino.nombre);
      this.step.set('origen');
      this.onSelectDestino.emit(destino);
      this.gamificationService.notification.set(`🔴 Destino: ${destino.nombre}`);
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    } else {
      this.step.set('destino');
    }
  }

  ngOnDestroy() {
    // Limpiar
  }

  // ============================================================
  // MÉTODOS DE BÚSQUEDA DE LUGARES
  // ============================================================
  
  onDestinoSearchChange(value: string) {
    this.destinoSearch.set(value);
    if (value.trim().length >= 2) {
      this.isLoadingDestino.set(true);
      this.lugarService.buscarLugares(value).subscribe({
        next: (response) => {
          this.isLoadingDestino.set(false);
          if (response.success && response.data) {
            this.sugerenciasDestino.set(response.data);
          } else {
            this.sugerenciasDestino.set([]);
          }
        },
        error: () => {
          this.isLoadingDestino.set(false);
          this.sugerenciasDestino.set([]);
        }
      });
    } else {
      this.sugerenciasDestino.set([]);
    }
  }

  onOrigenSearchChange(value: string) {
    this.origenSearch.set(value);
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

  // ============================================================
  // SELECCIONAR LUGARES
  // ============================================================
  
  selectDestino(lugar: Lugar) {
    const destino = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.destinoSeleccionado.set(destino);
    this.destinoSearch.set(lugar.nombre);
    this.sugerenciasDestino.set([]);
    this.onSelectDestino.emit(destino);
    
    this.step.set('origen');
    this.gamificationService.notification.set(`🔴 Destino: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  selectOrigen(lugar: Lugar) {
    const origen = {
      lat: lugar.latitud,
      lng: lugar.longitud,
      nombre: lugar.nombre
    };
    this.origenSeleccionado.set(origen);
    this.origenSearch.set(lugar.nombre);
    this.sugerenciasOrigen.set([]);
    this.onSelectOrigen.emit(origen);
    
    this.buscarRutas();
    this.gamificationService.notification.set(`🟢 Origen: ${lugar.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // GPS
  // ============================================================
  
  async usarGPS(tipo: 'origen' | 'destino') {
    try {
      const position = await this.routeSearchService.getCurrentPosition();
      const location = {
        lat: position.lat,
        lng: position.lng,
        nombre: '📍 Mi ubicación'
      };
      
      if (tipo === 'destino') {
        this.destinoSeleccionado.set(location);
        this.destinoSearch.set('📍 Mi ubicación');
        this.onSelectDestino.emit(location);
        this.step.set('origen');
        this.gamificationService.notification.set('📍 Destino: Tu ubicación actual');
      } else {
        this.origenSeleccionado.set(location);
        this.origenSearch.set('📍 Mi ubicación');
        this.onSelectOrigen.emit(location);
        this.buscarRutas();
        this.gamificationService.notification.set('🟢 Origen: Tu ubicación actual');
      }
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      this.gamificationService.notification.set('❌ Error al obtener ubicación');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }
  }

  // ============================================================
  // SELECCIONAR EN MAPA
  // ============================================================
  
  seleccionarEnMapa(tipo: 'origen' | 'destino') {
    this.modoSeleccion.set(tipo);
    this.gamificationService.notification.set(`🗺️ Haz clic en el mapa para seleccionar ${tipo === 'origen' ? 'ORIGEN' : 'DESTINO'}`);
    setTimeout(() => this.gamificationService.notification.set(''), 4000);
  }

  // ============================================================
  // RECIBIR CLICK DEL MAPA
  // ============================================================
  
  onMapClick(lat: number, lng: number) {
    const tipo = this.modoSeleccion();
    if (!tipo) return;
    
    const location = {
      lat,
      lng,
      nombre: tipo === 'origen' ? '🟢 Origen seleccionado' : '🔴 Destino seleccionado'
    };
    
    if (tipo === 'destino') {
      this.destinoSeleccionado.set(location);
      this.destinoSearch.set('📍 Punto en el mapa');
      this.onSelectDestino.emit(location);
      this.step.set('origen');
      this.gamificationService.notification.set('📍 Destino seleccionado en el mapa');
    } else {
      this.origenSeleccionado.set(location);
      this.origenSearch.set('📍 Punto en el mapa');
      this.onSelectOrigen.emit(location);
      this.buscarRutas();
      this.gamificationService.notification.set('🟢 Origen seleccionado en el mapa');
    }
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.modoSeleccion.set(null);
  }

  // ============================================================
  // BUSCAR RUTAS
  // ============================================================
  
  buscarRutas() {
    const origen = this.origenSeleccionado();
    const destino = this.destinoSeleccionado();
    
    if (!origen || !destino) {
      this.gamificationService.notification.set('⚠️ Selecciona origen y destino');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }
    
    this.isLoadingResultados.set(true);
    this.step.set('resultados');
    
    const request: BuscarRutasRequest = {
      origenLat: origen.lat,
      origenLng: origen.lng,
      destinoLat: destino.lat,
      destinoLng: destino.lng
    };
    
    this.routeSearchService.buscarRutas(request).subscribe({
      next: (response) => {
        this.isLoadingResultados.set(false);
        this.resultados.set(response.resultados);
        this.onSearchResults.emit(response.resultados);
        
        if (response.resultados.length === 0) {
          this.gamificationService.notification.set('❌ No se encontraron rutas');
          setTimeout(() => this.gamificationService.notification.set(''), 3000);
        } else {
          this.gamificationService.notification.set(`✅ ${response.resultados.length} rutas encontradas`);
          setTimeout(() => this.gamificationService.notification.set(''), 3000);
        }
      },
      error: (error) => {
        this.isLoadingResultados.set(false);
        console.error('Error al buscar rutas:', error);
        this.gamificationService.notification.set('❌ Error al buscar rutas');
        setTimeout(() => this.gamificationService.notification.set(''), 3000);
      }
    });
  }

  // ============================================================
  // SELECCIONAR RUTA
  // ============================================================
  
  selectRuta(resultado: RutaResultado) {
    console.log('🔄 Ruta seleccionada:', resultado);
    console.log('📋 Pasos:', resultado.pasos);
    
    this.rutaSeleccionada.set(resultado);
    this.step.set('ruta_seleccionada');
    this.onSelectRoute.emit(resultado);
    
    this.gamificationService.notification.set(`🗺️ Ruta seleccionada: ${resultado.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // VER PASOS - Método necesario para el HTML
  // ============================================================
  
  verPasos() {
    console.log('📋 Ver pasos de la ruta seleccionada');
    // Ya estamos en el paso 'ruta_seleccionada', solo mostramos los pasos
    this.gamificationService.notification.set('📋 Mostrando pasos del viaje');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // VOLVER A RESULTADOS
  // ============================================================
  
  volverAResultados() {
    this.step.set('resultados');
    this.rutaSeleccionada.set(null);
  }

  // ============================================================
  // CERRAR RUTA SELECCIONADA
  // ============================================================
  
  cerrarRutaSeleccionada() {
    this.step.set('destino');
    this.rutaSeleccionada.set(null);
    this.destinoSeleccionado.set(null);
    this.origenSeleccionado.set(null);
    this.resultados.set([]);
    this.destinoSearch.set('');
    this.origenSearch.set('');
    this.onClose.emit();
  }

  // ============================================================
  // VOLVER A BUSCAR
  // ============================================================
  
  volverABuscar() {
    this.step.set('origen');
    this.resultados.set([]);
    this.rutaSeleccionada.set(null);
  }

  // ============================================================
  // MOSTRAR EN MAPA
  // ============================================================
  
  mostrarEnMapa() {
    const ruta = this.rutaSeleccionada();
    if (ruta) {
      this.gamificationService.notification.set('🗺️ Mostrando ruta en el mapa');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }
  }

  // ============================================================
  // LIMPIAR ORIGEN
  // ============================================================
  
  limpiarOrigen() {
    this.origenSeleccionado.set(null);
    this.origenSearch.set('');
    this.onOrigenCleared.emit();
    this.step.set('origen');
  }

  // ============================================================
  // LIMPIAR DESTINO
  // ============================================================
  
  limpiarDestino() {
    this.destinoSeleccionado.set(null);
    this.destinoSearch.set('');
    this.onDestinoCleared.emit();
    this.step.set('destino');
  }

  // ============================================================
  // REINICIAR BÚSQUEDA
  // ============================================================
  
  reiniciarBusqueda() {
    this.step.set('destino');
    this.resultados.set([]);
    this.rutaSeleccionada.set(null);
  }

  // ============================================================
  // CERRAR TODO
  // ============================================================
  
  close() {
    this.step.set('destino');
    this.destinoSeleccionado.set(null);
    this.origenSeleccionado.set(null);
    this.resultados.set([]);
    this.rutaSeleccionada.set(null);
    this.destinoSearch.set('');
    this.origenSearch.set('');
    this.modoSeleccion.set(null);
    this.onClose.emit();
  }
}