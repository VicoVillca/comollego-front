import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    
    // Si no está autenticado, redirigir a login
    if (!token || !user) {
      console.log('⛔ No autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return false;
    }

    // 🔥 CUALQUIER usuario autenticado puede acceder al admin
    console.log('✅ Usuario autenticado, acceso permitido a:', state.url);
    return true;
  }
}