import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { GoogleLoginRequest, AuthResponse, AuthUser, ApiResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // ============================================================
  // 🔥 SEÑALES PARA EL ESTADO DEL USUARIO
  // ============================================================
  private currentUserSignal = signal<AuthUser | null>(null);
  private isLoggedInSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(false);
  private errorMessageSignal = signal<string | null>(null);

  // ============================================================
  // 🔥 EXPONER SEÑALES
  // ============================================================
  currentUser = this.currentUserSignal.asReadonly();
  isLoggedIn = this.isLoggedInSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  errorMessage = this.errorMessageSignal.asReadonly();

  // ============================================================
  // 🔥 CONSTRUCTOR - RESTAURAR SESIÓN
  // ============================================================
  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSignal.set(user);
        this.isLoggedInSignal.set(true);
        console.log('✅ Sesión restaurada:', user);
      } catch (e) {
        console.warn('⚠️ Error al restaurar sesión:', e);
        this.clearSession();
      }
    }
  }

  // ============================================================
  // 🔥 DECODIFICAR TOKEN JWT DE GOOGLE (en el frontend)
  // ============================================================
  private decodeGoogleToken(googleToken: string): any {
    try {
      const base64Url = googleToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }

  // ============================================================
  // 🔥 LOGIN CON GOOGLE (decodifica y envía al backend)
  // ============================================================
  loginWithGoogle(googleToken: string): void {
    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set(null);

    // 🔥 Decodificar el token de Google
    const decodedToken = this.decodeGoogleToken(googleToken);
    
    if (!decodedToken) {
      this.errorMessageSignal.set('Error al decodificar el token de Google');
      this.isLoadingSignal.set(false);
      return;
    }

    console.log('📋 Token decodificado:', decodedToken);

    // 🔥 Construir request con los datos decodificados
    const request: GoogleLoginRequest = {
      googleSub: decodedToken.sub || '',
      email: decodedToken.email || '',
      name: decodedToken.name || 'Usuario',
      picture: decodedToken.picture || ''
    };

    console.log('📤 Enviando al backend:', request);

    this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/google`, request)
      .subscribe({
        next: (response) => {
          console.log('📦 Respuesta del backend:', response);
          
          if (response.success && response.data) {
            this.setSession(response.data);
            this.isLoadingSignal.set(false);
            this.router.navigate(['/']);
          } else {
            this.handleError(response.messages);
          }
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.handleError(['Error al conectar con el servidor']);
          this.isLoadingSignal.set(false);
        }
      });
  }

  private handleError(messages: string[]): void {
    const errorMsg = messages.join(' • ');
    this.errorMessageSignal.set(errorMsg);
    this.isLoadingSignal.set(false);
    console.error('❌ Error:', errorMsg);
  }

  // ============================================================
  // 🔥 GUARDAR SESIÓN
  // ============================================================
  private setSession(authData: AuthResponse): void {
    const { token, user } = authData;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    this.currentUserSignal.set(user);
    this.isLoggedInSignal.set(true);
    
    console.log('✅ Sesión iniciada:', user);
  }

  // ============================================================
  // 🔥 CERRAR SESIÓN
  // ============================================================
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.isLoggedInSignal.set(false);
  }

  // ============================================================
  // 🔥 OBTENER TOKEN (para el interceptor)
  // ============================================================
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}