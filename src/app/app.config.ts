import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🔥 Zone detection (mejora rendimiento)
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // 🔥 Rutas
    provideRouter(routes),
    
    // 🔥 Animaciones
    provideAnimations(),
    
    // 🔥 HTTP Client con interceptors
    provideHttpClient(withInterceptorsFromDi()),
    
    // 🔥 Interceptor de autenticación (agrega token a las peticiones)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    
    // 🔥 PrimeNG con tema Aura
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng'
          }
        }
      }
    })
  ]
};