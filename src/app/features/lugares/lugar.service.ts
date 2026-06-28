import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lugar } from '../../core/models/transit.models';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  messages?: string[];
  timestamp?: string;
  path?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LugarService {
  private http = inject(HttpClient);
  // 🔥 CORREGIDO: apiUrl = environment.apiUrl + '/lugares'
  private apiUrl = `${environment.apiUrl}/lugares`;

  obtenerTodos(): Observable<ApiResponse<Lugar[]>> {
    return this.http.get<ApiResponse<Lugar[]>>(this.apiUrl);
  }

  buscarLugares(term: string): Observable<ApiResponse<Lugar[]>> {
    // 🔥 CORREGIDO: usa this.apiUrl directamente
    return this.http.get<ApiResponse<Lugar[]>>(`${this.apiUrl}/buscar?term=${encodeURIComponent(term)}`);
  }

  obtenerLugar(id: number): Observable<ApiResponse<Lugar>> {
    return this.http.get<ApiResponse<Lugar>>(`${this.apiUrl}/${id}`);
  }

  crearLugar(lugar: Partial<Lugar>): Observable<ApiResponse<Lugar>> {
    return this.http.post<ApiResponse<Lugar>>(this.apiUrl, lugar);
  }

  actualizarLugar(id: number, lugar: Partial<Lugar>): Observable<ApiResponse<Lugar>> {
    return this.http.put<ApiResponse<Lugar>>(`${this.apiUrl}/${id}`, lugar);
  }

  eliminarLugar(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}