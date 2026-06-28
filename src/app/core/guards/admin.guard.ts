import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.currentUser();
    const userRole = (user as any)?.role || 'USER';
    
    // Verificar si está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Verificar si es ADMIN
    if (userRole !== 'ADMIN') {
      console.warn('⛔ Acceso denegado: se requiere rol ADMIN');
      this.router.navigate(['/']);
      return false;
    }
    
    return true;
  }
}