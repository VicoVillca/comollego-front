import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private authService = inject(AuthService);

  isLoading = this.authService.isLoading;
  errorMessage = this.authService.errorMessage;

  ngAfterViewInit() {
    setTimeout(() => this.initGoogleLogin(), 500);
  }

  initGoogleLogin() {
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => this.initGoogleLogin(), 1000);
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleLogin(response),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin'
      });

      const buttonElement = document.getElementById('google-btn');
      if (buttonElement) {
        google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: '100%'
        });
      }
    } catch (error) {
      console.error('❌ Error al inicializar Google Login:', error);
    }
  }

  handleGoogleLogin(response: any) {
    const googleToken = response.credential;
    if (!googleToken) return;

    // 🔥 El AuthService se encarga de decodificar y enviar al backend
    this.authService.loginWithGoogle(googleToken);
  }
}