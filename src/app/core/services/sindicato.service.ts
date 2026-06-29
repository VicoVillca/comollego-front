
// src/app/core/services/sindicato.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sindicato } from '../models/transit.models';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  messages?: string[];
  timestamp?: string;
  path?: string | null;
}

export interface PageableResponse<T> {
  success: boolean;
  data: {
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  messages?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SindicatoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sindicatos`;

  // Obtener todos los sindicatos
  obtenerTodos(): Observable<ApiResponse<Sindicato[]>> {
    return this.http.get<ApiResponse<Sindicato[]>>(this.apiUrl);
  }

  // Obtener sindicato por ID
  obtenerSindicato(id: number): Observable<ApiResponse<Sindicato>> {
    return this.http.get<ApiResponse<Sindicato>>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo sindicato
  crearSindicato(sindicato: Partial<Sindicato>): Observable<ApiResponse<Sindicato>> {
    return this.http.post<ApiResponse<Sindicato>>(this.apiUrl, sindicato);
  }

  // Actualizar sindicato
  actualizarSindicato(id: number, sindicato: Partial<Sindicato>): Observable<ApiResponse<Sindicato>> {
    return this.http.put<ApiResponse<Sindicato>>(`${this.apiUrl}/${id}`, sindicato);
  }

  // Eliminar sindicato
  eliminarSindicato(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Obtener sindicatos con paginación
  obtenerSindicatosPageable(page: number = 0, size: number = 10): Observable<PageableResponse<Sindicato>> {
    return this.http.get<PageableResponse<Sindicato>>(
      `${this.apiUrl}/pageable?page=${page}&size=${size}`
    );
  }
}