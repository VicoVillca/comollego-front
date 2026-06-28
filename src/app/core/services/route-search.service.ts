import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================
// MODELOS
// ============================================================

export interface BuscarRutasRequest {
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
}

export interface RutaResultado {
  id: number;
  nombre: string;
  codigo: string;
  color: string;
  tipoTransporte: string;
  icono: string;
  polylineIda: string;
  polylineVuelta?: string;
  distanciaKm: number;
  duracionMin: number;
  puntuacion: number; // 0-100
  pasos?: Paso[];
}

export interface Paso {
  tipo: 'walk' | 'bus' | 'train' | 'teleferico' | 'minibus';
  descripcion: string;
  distancia?: number;
  tiempo?: number;
}

export interface BuscarRutasResponse {
  resultados: RutaResultado[];
}

// ============================================================
// MOCK DATA (para pruebas sin backend)
// ============================================================

const MOCK_RESULTADOS: RutaResultado[] = [
  {
    id: 1,
    nombre: 'Línea Roja',
    codigo: 'TRF-001',
    color: '#E53E3E',
    tipoTransporte: 'Teleférico',
    icono: '🚠',
    polylineIda: '-16.4930,-68.1401;-16.4935,-68.1435;-16.4945,-68.1495;-16.4938,-68.1560;-16.4925,-68.1632',
    distanciaKm: 2.4,
    duracionMin: 10,
    puntuacion: 95,
    pasos: [
      { tipo: 'walk', descripcion: 'Camina 200m hasta la Estación Central', distancia: 0.2, tiempo: 3 },
      { tipo: 'teleferico', descripcion: 'Toma el Teleférico Línea Roja', distancia: 2.2, tiempo: 7 },
      { tipo: 'walk', descripcion: 'Camina 150m hasta tu destino', distancia: 0.15, tiempo: 2 }
    ]
  },
  {
    id: 2,
    nombre: 'Línea Verde',
    codigo: 'TRF-002',
    color: '#22C55E',
    tipoTransporte: 'Teleférico',
    icono: '🚠',
    polylineIda: '-16.5230,-68.0840;-16.5250,-68.0900;-16.5280,-68.0980;-16.5300,-68.1050;-16.5320,-68.1120',
    distanciaKm: 3.1,
    duracionMin: 15,
    puntuacion: 82,
    pasos: [
      { tipo: 'walk', descripcion: 'Camina 150m hasta la Estación Irpavi', distancia: 0.15, tiempo: 2 },
      { tipo: 'teleferico', descripcion: 'Toma el Teleférico Línea Verde', distancia: 2.8, tiempo: 12 },
      { tipo: 'walk', descripcion: 'Camina 100m hasta tu destino', distancia: 0.1, tiempo: 1 }
    ]
  },
  {
    id: 3,
    nombre: 'Trufi Express 40',
    codigo: '40',
    color: '#D97706',
    tipoTransporte: 'Trufi',
    icono: '🚗',
    polylineIda: '-16.5262,-68.0772;-16.5270,-68.0905;-16.5180,-68.1050;-16.5100,-68.1180;-16.5034,-68.1305;-16.4996,-68.1344;-16.4952,-68.1370',
    distanciaKm: 4.2,
    duracionMin: 20,
    puntuacion: 76,
    pasos: [
      { tipo: 'walk', descripcion: 'Camina 100m hasta la parada de Trufi', distancia: 0.1, tiempo: 1 },
      { tipo: 'minibus', descripcion: 'Toma el Trufi Express 40', distancia: 4.0, tiempo: 18 },
      { tipo: 'walk', descripcion: 'Camina 50m hasta tu destino', distancia: 0.05, tiempo: 1 }
    ]
  },
  {
    id: 4,
    nombre: 'Micro 42',
    codigo: '42',
    color: '#0284C7',
    tipoTransporte: 'Micro',
    icono: '🚌',
    polylineIda: '-16.4891,-68.1215;-16.4920,-68.1220;-16.4962,-68.1235;-16.4975,-68.1270;-16.4980,-68.1305;-16.4996,-68.1344;-16.4980,-68.1380;-16.4950,-68.1444;-16.4940,-68.1500',
    distanciaKm: 3.8,
    duracionMin: 18,
    puntuacion: 68,
    pasos: [
      { tipo: 'walk', descripcion: 'Camina 200m hasta la parada de Micro', distancia: 0.2, tiempo: 3 },
      { tipo: 'bus', descripcion: 'Toma el Micro 42', distancia: 3.5, tiempo: 14 },
      { tipo: 'walk', descripcion: 'Camina 80m hasta tu destino', distancia: 0.08, tiempo: 1 }
    ]
  }
];

// ============================================================
// SERVICIO
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class RouteSearchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rutas/buscar`;

  /**
   * Busca rutas entre dos puntos
   */
  buscarRutas(request: BuscarRutasRequest): Observable<BuscarRutasResponse> {
    // 🔥 MODO MOCK (descomentar para pruebas sin backend)
    return new Observable(observer => {
      // Simular delay de red
      setTimeout(() => {
        // Filtrar resultados por proximidad (simulado)
        let resultados = [...MOCK_RESULTADOS];
        
        // Simular que algunas rutas son más relevantes según la distancia
        const distanciaTotal = this.calcularDistancia(
          request.origenLat, request.origenLng,
          request.destinoLat, request.destinoLng
        );
        
        // Ordenar por puntuación
        resultados = resultados.sort((a, b) => b.puntuacion - a.puntuacion);
        
        // Limitar a 5 resultados
        resultados = resultados.slice(0, 5);
        
        observer.next({ resultados });
        observer.complete();
      }, 800);
    });

    // 🔥 MODO REAL (descomentar para usar backend)
    // return this.http.post<BuscarRutasResponse>(this.apiUrl, request);
  }

  /**
   * Calcula la distancia entre dos puntos (fórmula de Haversine)
   */
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Obtiene la ubicación actual del usuario (GPS)
   */
  getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no disponible'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}