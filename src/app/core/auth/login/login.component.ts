import { Component, inject, signal, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  private checkInterval: any = null;
  private maxAttempts = 30; // 30 * 500ms = 15 segundos
  private attempts = 0;

  ngOnInit() {
    console.log('🔄 LoginComponent: ngOnInit');

    const isAuth = this.authService.isAuthenticated();
    console.log('🔐 isAuthenticated:', isAuth);

    if (isAuth) {
      const user = this.authService.currentUser();
      console.log('👤 Usuario ya autenticado:', user);
      console.log('🚀 Redirigiendo a /admin');
      this.router.navigate(['/admin']);
      return;
    }
  }

  ngAfterViewInit() {
    console.log('🔄 LoginComponent: ngAfterViewInit');
    if (!this.authService.isAuthenticated()) {
      this.loadGoogleScript();
    } else {
      console.log('ℹ️ Usuario ya autenticado, no se renderiza botón');
    }
  }

  ngOnDestroy() {
    console.log('🔄 LoginComponent: ngOnDestroy');
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private loadGoogleScript() {
    console.log('📥 Cargando Google Script...');
    
    if (typeof google !== 'undefined' && google.accounts) {
      console.log('✅ Google API ya cargada');
      this.initGoogleLogin();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google API cargada desde script');
      this.initGoogleLogin();
    };
    script.onerror = () => {
      console.error('❌ Error al cargar Google API');
      this.errorMessage.set('Error al cargar Google API');
    };
    document.head.appendChild(script);
  }

  private initGoogleLogin() {
    console.log('🔄 Inicializando Google Login...');
    
    if (typeof google === 'undefined' || !google.accounts) {
      console.error('❌ Google API no cargada');
      return;
    }

    const buttonElement = document.getElementById('google-signin-btn');
    if (!buttonElement) {
      console.error('❌ Elemento #google-signin-btn no encontrado');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: '467610761770-3b1fee3dpi2m1qnpcnd5olqk9gbut2j9.apps.googleusercontent.com',
        callback: (response: any) => this.handleCredentialResponse(response)
      });

      google.accounts.id.renderButton(
        buttonElement,
        {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'continue_with',
          logo_alignment: 'left'
        }
      );
      console.log('✅ Botón de Google renderizado');
    } catch (error) {
      console.error('❌ Error al inicializar Google:', error);
      this.errorMessage.set('Error al inicializar Google');
    }
  }

  private handleCredentialResponse(response: any) {
    console.log('🔄 handleCredentialResponse:', response);
    
    if (!response.credential) {
      this.errorMessage.set('Error al obtener credenciales');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // 🔥 Llamar al login
    this.authService.loginWithGoogle(response.credential);

    // 🔥 ESPERAR A QUE EL USUARIO ESTÉ AUTENTICADO
    this.attempts = 0;
    this.checkInterval = setInterval(() => {
      this.attempts++;
      const isAuth = this.authService.isAuthenticated();
      const user = this.authService.currentUser();
      
      console.log(`⏳ Esperando autenticación... (${this.attempts}/${this.maxAttempts})`);
      
      if (isAuth && user) {
        // ✅ Usuario autenticado correctamente - CUALQUIER ROL
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        this.isLoading.set(false);
        
        console.log('👤 Usuario autenticado:', user);
        console.log('🔑 Rol:', (user as any)?.role);
        console.log('🚀 Redirigiendo a /admin');
        this.router.navigate(['/admin']);
        return;
      }
      
      if (this.attempts >= this.maxAttempts) {
        // ⏰ Timeout - algo salió mal
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        this.isLoading.set(false);
        
        // 🔥 Verificar si hay un error del backend
        const errorMsg = this.authService.errorMessage();
        if (errorMsg) {
          this.errorMessage.set(errorMsg);
        } else {
          this.errorMessage.set('Error en la autenticación. Intenta nuevamente.');
        }
        console.error('❌ Timeout de autenticación');
      }
    }, 500);
  }
}