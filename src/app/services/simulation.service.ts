import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { RouteService } from './route.service';
import { GamificationService } from './gamification.service';
import { Ruta } from '../models/transit.models';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly routeService = inject(RouteService);
  private readonly gamificationService = inject(GamificationService);

  // --- ESTADO DE SIMULACIÓN (ahora con number) ---
  readonly simulatingRouteId = signal<number | null>(null);
  readonly simIndex = signal<number | null>(null);
  readonly simSpeed = signal<number>(1);
  
  // --- COORDENADA ACTUAL (decodificada desde polylineIda) ---
  readonly simulationCoords = computed<[number, number] | null>(() => {
    const routeId = this.simulatingRouteId();
    const index = this.simIndex();
    if (!routeId || index === null) return null;
    
    const route = this.routeService.routes().find(r => r.id === routeId);
    if (!route || !route.polylineIda) return null;
    
    // Decodificar polylineIda a array de [lat, lng]
    const coords = this.decodePolyline(route.polylineIda);
    return coords[index] || null;
  });

  private intervalId: any = null;

  // ============================================================
  // CONSTRUCTOR: detener simulación si cambia la ruta seleccionada
  // ============================================================
  constructor() {
    effect(() => {
      const selectedId = this.routeService.selectedRouteId();
      if (selectedId !== this.simulatingRouteId()) {
        this.stopSimulation();
      }
    }, { allowSignalWrites: true });
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================
  startSimulation(routeId: number) {
    this.stopSimulation();
    this.simulatingRouteId.set(routeId);
    this.simIndex.set(0);
    this.gamificationService.triggerExpGain(4, 'Simulador GPS iniciado');
    this.runTick();
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.simulatingRouteId.set(null);
    this.simIndex.set(null);
  }

  setSpeed(speed: number) {
    this.simSpeed.set(speed);
    if (this.simulatingRouteId()) {
      this.runTick();
    }
  }

  // ============================================================
  // MÉTODO DE TICK (actualiza índice)
  // ============================================================
  private runTick() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    const intervalTime = Math.max(200, 1200 / this.simSpeed());
    
    this.intervalId = setInterval(() => {
      const route = this.routeService.routes().find(r => r.id === this.simulatingRouteId());
      if (!route || !route.polylineIda) {
        this.stopSimulation();
        return;
      }

      // Decodificar polyline para obtener cantidad de puntos
      const coords = this.decodePolyline(route.polylineIda);
      if (coords.length === 0) {
        this.stopSimulation();
        return;
      }

      this.simIndex.update(idx => {
        const next = (idx ?? 0) + 1;
        if (next >= coords.length) {
          this.gamificationService.triggerExpGain(5, 'Simulación completada en recorrido');
          return 0; // Loop
        }
        return next;
      });
    }, intervalTime);
  }

  // ============================================================
  // UTILIDADES: decodificar polyline (simplificado)
  // ============================================================
  /**
   * Decodifica un polyline codificado (por ejemplo, de Google Maps)
   * Si usas @mapbox/polyline, puedes importarlo y usar polyline.decode()
   * Aquí implemento una versión simplificada que asume que el string
   * es una lista de "lat,lng" separadas por punto y coma (;)
   */
  private decodePolyline(polyline: string): [number, number][] {
    if (!polyline) return [];
    // Si es un polyline codificado de Google (ej: "_p~iF~ps|U_ulL...")
    // Deberías usar una librería como @mapbox/polyline.
    // Para este mock, asumimos que el string es "lat,lng;lat,lng;..."
    if (polyline.includes(';')) {
      return polyline.split(';').map(pair => {
        const [lat, lng] = pair.split(',').map(Number);
        return [lat, lng];
      });
    }
    // Si es un polyline codificado real, usarías decode:
    // return polyline.decode(polyline) as [number, number][];
    return [];
  }

  // ============================================================
  // OBTENER NOMBRE DE LA PRÓXIMA PARADA (usando paradas)
  // ============================================================
  getSimulatingLocationName(): string {
    const routeId = this.simulatingRouteId();
    const index = this.simIndex();
    if (!routeId || index === null) return '';
    
    const route = this.routeService.routes().find(r => r.id === routeId);
    if (!route) return '';
    
    // Obtener coordenada actual
    const coords = this.decodePolyline(route.polylineIda);
    const currentCoord = coords[index];
    if (!currentCoord) return '';

    // Buscar parada cercana (dentro de ~500m ≈ 0.005 grados)
    const nearbyStop = route.paradas?.find(p => 
      Math.abs(p.latitud - currentCoord[0]) < 0.005 && 
      Math.abs(p.longitud - currentCoord[1]) < 0.005
    );

    return nearbyStop ? `Próxima parada: ${nearbyStop.nombre}` : `Aproximando punto intermedio #${index + 1}`;
  }
}