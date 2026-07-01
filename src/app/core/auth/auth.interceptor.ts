import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  // 📝 Rutas públicas (puedes usar regex para más flexibilidad)
  private publicRoutes = [
    { method: 'GET', url: '/api/rutas' },
    { method: 'GET', url: '/api/lugares/buscar' },
    { method: 'POST', url: '/api/login' },
    { method: 'POST', url: '/api/register' },
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 🔍 Verificar si la ruta es pública
    const isPublic = this.publicRoutes.some(route => 
      req.method === route.method && req.url.includes(route.url)
    );

    // 🚫 Si es pública, pasar sin modificar
    if (isPublic) {
      return next.handle(req);
    }

    // 🔐 Para rutas protegidas, agregar token
    const token = this.authService.getToken();
    
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}