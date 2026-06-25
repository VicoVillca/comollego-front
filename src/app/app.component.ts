import { Component, inject, signal, computed, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Search, 
  Plus, 
  Compass, 
  Sparkles, 
  ArrowRight,
  X,
  Map as MapIcon,
  User,
  Users,
  Smartphone,
  Download,
  Award,
  ChevronUp,
  ChevronDown,
  Bus,
  Route
} from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { RouteService } from './core/services/route.service';
import { GamificationService } from './core/services/gamification.service';
import { MapComponent } from './features/map/map';
import { RouteDetailsComponent } from './features/routes/route-details/route-details';
import { RouteEditorComponent } from './features/routes/route-editor/route-editor';
import { Ruta, Sindicato, Parada, Lugar } from './core/models/transit.models';
import { SINDICATOS_MOCK, LUGARES_MOCK } from './data/mock-data';

// 🔥 DECLARAR GOOGLE PARA TYPESCRIPT
declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule,
    ButtonModule,
    InputTextModule,
    BadgeModule,
    CardModule,
    MapComponent,
    RouteDetailsComponent,
    RouteEditorComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  readonly routeService = inject(RouteService);
  readonly gamificationService = inject(GamificationService);

  // ICONOS
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly CompassIcon = Compass;
  readonly SparklesIcon = Sparkles;
  readonly ArrowRightIcon = ArrowRight;
  readonly XIcon = X;
  readonly MapIcon = MapIcon;
  readonly UserIcon = User;
  readonly UsersIcon = Users;
  readonly SmartphoneIcon = Smartphone;
  readonly DownloadIcon = Download;
  readonly AwardIcon = Award;
  readonly ChevronUpIcon = ChevronUp;
  readonly ChevronDownIcon = ChevronDown;
  readonly BusIcon = Bus;
  readonly RouteIcon = Route;

  // ============================================================
  // 🔐 LOGIN CON GOOGLE
  // ============================================================
  isLoggedIn = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  loginEmail = '';
  loginPassword = '';
  
  // 🔥 REEMPLAZAR CON TU CLIENT ID DE GOOGLE
  googleClientId = '467610761770-3b1fee3dpi2m1qnpcnd5olqk9gbut2j9.apps.googleusercontent.com';
  
  // Usuario actual (después del login)
  currentUser = signal<any>(null);

  // ============================================================
  // ESTADO UI
  // ============================================================
  activeEditDraft = signal<Partial<Ruta>>({});
  visibleCountSearch = signal(5);
  
  // ============================================================
  // 🆕 DIALOGS
  // ============================================================
  showUserDialog = signal(false);
  showLineSearch = signal(false);
  showAppDialog = signal(false);
  showDevDialog = signal(false);
  showAddLugarModal = signal(false);
  showLugarSuggestions = signal(false);
  
  // ============================================================
  // 🆕 BUSCADOR DE LUGARES
  // ============================================================
  lugarSearchText = signal('');
  lugares: Lugar[] = LUGARES_MOCK;
  
  // ============================================================
  // 🆕 FORMULARIO NUEVO LUGAR
  // ============================================================
  newLugarNombre = '';
  newLugarCiudad = '';
  newLugarLat = -16.5000;
  newLugarLng = -68.1300;
  newLugarDesc = '';
  
  // ============================================================
  // 🆕 SINDICATOS
  // ============================================================
  drawerSindicatosSearch = signal('');
  drawerSindicatosLimit = signal(15);
  
  readonly allSindicatos: Sindicato[] = SINDICATOS_MOCK;

  filteredSindicatos = computed(() => {
    const term = this.drawerSindicatosSearch().toLowerCase().trim();
    const list = this.allSindicatos.filter(s => 
      s.nombre.toLowerCase().includes(term) || 
      (s.descripcion?.toLowerCase().includes(term) ?? false)
    );
    return list.slice(0, this.drawerSindicatosLimit());
  });

  // ============================================================
  // 🗺️ SEÑALES PARA EL MAPA
  // ============================================================
  mapPolyline = signal<string>('');
  mapStops = signal<Parada[]>([]);
  mapColor = signal<string>('#3B82F6');

  // ============================================================
  // 🔥 DIRECCIÓN ACTUAL DEL EDITOR
  // ============================================================
  editorDirection = signal<'ida' | 'vuelta'>('ida');

  mapMode = computed<'view' | 'edit'>(() => {
    if (this.routeService.isEditing() || this.routeService.isCreating()) {
      return 'edit';
    }
    return 'view';
  });

  // ============================================================
  // 🆕 FILTRO DE LUGARES (para sugerencias)
  // ============================================================
  filteredLugares = computed(() => {
    const search = this.lugarSearchText().toLowerCase().trim();
    if (!search) return [];
    return this.lugares.filter(l => 
      l.nombre.toLowerCase().includes(search) || 
      l.ciudad.toLowerCase().includes(search) ||
      (l.descripcion?.toLowerCase().includes(search) ?? false)
    );
  });

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    // 🔥 Verificar si ya está logueado
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      this.isLoggedIn.set(true);
      this.currentUser.set(JSON.parse(userData));
      console.log('✅ Usuario ya logueado:', this.currentUser());
    }

    // Efecto para cuando se está editando o creando
    effect(() => {
      if (this.routeService.isEditing()) {
        const selected = this.routeService.selectedRoute();
        if (selected) {
          this.activeEditDraft.set({ ...selected });
          this.updateMapFromRoute(selected);
          this.editorDirection.set('ida');
        }
      } else if (this.routeService.isCreating()) {
        const newDraft: Partial<Ruta> = {
          id: Date.now(),
          nombreRuta: 'Nuevo Recorrido Colaborativo',
          color: '#0D9488',
          polylineIda: '',
          polylineVuelta: '',
          distanciaKm: 0,
          duracionMin: 0,
          intervaloMin: 5,
          estado: 'activo',
          numeroParadas: 0,
          paradas: [],
          paradasVuelta: [],
          sindicatoId: 1,
          tipoTransporteId: 1,
          versionActual: 1
        };
        this.activeEditDraft.set(newDraft);
        this.mapPolyline.set('');
        this.mapStops.set([]);
        this.mapColor.set('#0D9488');
        this.editorDirection.set('ida');
      }
    }, { allowSignalWrites: true });

    // Efecto para cuando se selecciona una ruta (sin editar)
    effect(() => {
      const selectedRoute = this.routeService.selectedRoute();
      if (selectedRoute && !this.routeService.isEditing() && !this.routeService.isCreating()) {
        this.updateMapFromRoute(selectedRoute);
      }
    });
  }

  // ============================================================
  // 🔐 AFTER VIEW INIT - INICIALIZAR GOOGLE LOGIN
  // ============================================================
  ngAfterViewInit() {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.initGoogleLogin();
    }, 500);
  }

  // ============================================================
  // 🔐 INICIALIZAR GOOGLE LOGIN
  // ============================================================
  initGoogleLogin() {
    // Verificar que el SDK de Google esté cargado
    if (typeof google === 'undefined' || !google.accounts) {
      console.warn('⚠️ Google SDK no cargado aún, reintentando...');
      setTimeout(() => this.initGoogleLogin(), 1000);
      return;
    }

    console.log('✅ Inicializando Google Login...');

    try {
      // Inicializar Google Identity Services
      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response: any) => this.handleGoogleLogin(response),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin'
      });

      // Renderizar botón de Google
      const buttonElement = document.getElementById('google-btn');
      if (buttonElement) {
        google.accounts.id.renderButton(
          buttonElement,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: '100%'
          }
        );
        console.log('✅ Botón de Google renderizado');
      } else {
        console.warn('⚠️ Elemento #google-btn no encontrado');
      }

      // Opcional: One Tap (autenticación automática)
      // google.accounts.id.prompt();

    } catch (error) {
      console.error('❌ Error al inicializar Google Login:', error);
    }
  }

  // ============================================================
  // 🔐 MANEJAR LOGIN CON GOOGLE
  // ============================================================
  handleGoogleLogin(response: any) {
    console.log('🔐 Google login response:', response);
    
    const googleToken = response.credential;
    
    if (!googleToken) {
      this.gamificationService.notification.set('❌ Error al autenticar con Google');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }

    this.authenticateWithGoogle(googleToken);
  }

  // ============================================================
  // 🔐 AUTENTICAR CON GOOGLE
  // ============================================================
  authenticateWithGoogle(googleToken: string) {
    this.isLoading.set(true);

    // 🔥 MOCK: Simular autenticación con backend
    // En producción, reemplazar con:
    // this.http.post('/api/auth/login', { token: googleToken }).subscribe(...)
    
    setTimeout(() => {
      // Decodificar el token JWT de Google (solo para obtener datos del usuario)
      // El token es un JWT, podemos decodificarlo para obtener el payload
      let userData: any = {};
      try {
        // Decodificar el token JWT (sin verificar firma, solo para leer datos)
        const base64Url = googleToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        userData = JSON.parse(jsonPayload);
        console.log('📋 Datos del usuario desde Google:', userData);
      } catch (error) {
        console.warn('⚠️ No se pudo decodificar el token de Google, usando datos mock');
        userData = {
          name: 'Usuario de Google',
          email: 'usuario@gmail.com',
          picture: ''
        };
      }

      const finalUser = {
        id: userData.sub || Date.now().toString(),
        name: userData.name || 'Usuario de Google',
        email: userData.email || 'usuario@gmail.com',
        picture: userData.picture || '',
        googleId: userData.sub || ''
      };

      // Guardar en localStorage
      localStorage.setItem('auth_token', googleToken);
      localStorage.setItem('user', JSON.stringify(finalUser));

      this.currentUser.set(finalUser);
      this.isLoggedIn.set(true);
      this.isLoading.set(false);

      console.log('✅ Usuario autenticado:', finalUser);
      
      // Notificar al usuario
      this.gamificationService.notification.set(`✅ Bienvenido, ${finalUser.name}!`);
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }, 1000);
  }

  // ============================================================
  // 🔐 LOGIN CON EMAIL (opcional, para pruebas)
  // ============================================================
  loginWithEmail() {
    if (!this.loginEmail || !this.loginPassword) {
      this.gamificationService.notification.set('⚠️ Ingresa email y contraseña');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }

    this.isLoading.set(true);
    
    setTimeout(() => {
      const userData = {
        id: Date.now().toString(),
        name: this.loginEmail.split('@')[0],
        email: this.loginEmail,
        picture: ''
      };

      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      localStorage.setItem('user', JSON.stringify(userData));

      this.currentUser.set(userData);
      this.isLoggedIn.set(true);
      this.isLoading.set(false);

      this.gamificationService.notification.set(`✅ Bienvenido, ${userData.name}!`);
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }, 1000);
  }

  // ============================================================
  // 🔐 CERRAR SESIÓN
  // ============================================================
  logout() {
    // Si hay sesión de Google, cerrarla también
    if (typeof google !== 'undefined' && google.accounts) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.warn('⚠️ Error al cerrar sesión de Google:', error);
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.gamificationService.notification.set('👋 Sesión cerrada');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  // ============================================================
  // 🗺️ MÉTODOS PARA ACTUALIZAR EL MAPA
  // ============================================================
  private updateMapFromRoute(route: Ruta) {
    if (!route) return;
    
    const polyline = route.polylineIda || route.polylineVuelta || '';
    const stops = route.paradas || route.paradasVuelta || [];
    const color = route.color || '#3B82F6';
    
    this.mapPolyline.set(polyline);
    this.mapStops.set(stops);
    this.mapColor.set(color);
  }

  // ============================================================
  // 🔥 MANEJAR DATOS DEL EDITOR
  // ============================================================
  handleMapDataFromEditor(data: { polyline: string; stops: Parada[]; color: string }) {
    console.log('📦 Datos recibidos del editor:', data);
    
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
    this.mapColor.set(data.color);
  }

  // ============================================================
  // 🔥 MANEJAR CAMBIO DE DIRECCIÓN
  // ============================================================
  onDirectionChanged(direction: 'ida' | 'vuelta') {
    console.log('🔄 Dirección cambiada a:', direction);
    this.editorDirection.set(direction);
  }

  // ============================================================
  // 🗺️ MANEJAR DATOS DE ROUTE-DETAILS
  // ============================================================
  handleMapDataFromDetails(data: { polyline: string; stops: Parada[]; color: string }) {
    console.log('📦 Datos recibidos de detalles:', data);
    
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
    this.mapColor.set(data.color);
  }

  // ============================================================
  // 🗺️ EVENTOS DEL MAPA
  // ============================================================
  handleMapClick(lat: number, lng: number) {
    if (!this.routeService.isEditing() && !this.routeService.isCreating()) return;

    const draft = this.activeEditDraft();
    if (!draft) return;

    const currentDirection = this.editorDirection();
    
    const currentPolyline = currentDirection === 'ida' 
      ? (draft.polylineIda || '') 
      : (draft.polylineVuelta || '');
    
    const newCoord = `${lat},${lng}`;
    const updatedPolyline = currentPolyline ? `${currentPolyline};${newCoord}` : newCoord;

    this.activeEditDraft.update(d => {
      const update: any = { ...d };
      
      if (currentDirection === 'ida') {
        update.polylineIda = updatedPolyline;
        update.polylineVuelta = d.polylineVuelta || '';
      } else {
        update.polylineVuelta = updatedPolyline;
        update.polylineIda = d.polylineIda || '';
      }
      
      return update;
    });
    
    this.mapPolyline.set(updatedPolyline);
  }

  handleStopClick(stop: Parada) {
    console.log('🖱️ Click en parada:', stop.nombre);
    
    this.gamificationService.notification.set(`📍 Parada: ${stop.nombre}`);
    
    setTimeout(() => {
      this.gamificationService.notification.set('');
    }, 3000);
  }

  handleMapDataChanged(data: { polyline: string; stops: Parada[] }) {
    console.log('📦 Datos actualizados desde el mapa:', data);
    console.log('📍 Dirección actual del editor:', this.editorDirection());
    
    const draft = this.activeEditDraft();
    if (!draft) return;
    
    const currentDirection = this.editorDirection();
    
    this.activeEditDraft.update(d => {
      const update: any = { ...d };
      
      if (currentDirection === 'ida') {
        update.polylineIda = data.polyline;
        update.paradas = data.stops;
        update.polylineVuelta = d.polylineVuelta || '';
        update.paradasVuelta = d.paradasVuelta || [];
      } else {
        update.polylineVuelta = data.polyline;
        update.paradasVuelta = data.stops;
        update.polylineIda = d.polylineIda || '';
        update.paradas = d.paradas || [];
      }
      
      return update;
    });
    
    this.mapPolyline.set(data.polyline);
    this.mapStops.set(data.stops);
  }

  // ============================================================
  // 🆕 BUSCADOR DE LUGARES (como Google)
  // ============================================================
  onLugarSearchChange(value: string) {
    this.lugarSearchText.set(value);
    if (value.trim().length > 0) {
      this.showLugarSuggestions.set(true);
    } else {
      this.showLugarSuggestions.set(false);
    }
  }

  clearLugarSearch() {
    this.lugarSearchText.set('');
    this.showLugarSuggestions.set(false);
  }

  onLugarBlur() {
    setTimeout(() => {
      this.showLugarSuggestions.set(false);
    }, 200);
  }

  selectLugar(lugar: Lugar) {
    console.log('📍 Lugar seleccionado:', lugar);
    this.gamificationService.notification.set(`📍 ${lugar.nombre} (${lugar.ciudad})`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.lugarSearchText.set('');
    this.showLugarSuggestions.set(false);
  }

  // ============================================================
  // 🆕 DIALOGS
  // ============================================================
  toggleUserDialog() {
    this.showUserDialog.update(v => !v);
  }

  toggleLineSearch() {
    this.showLineSearch.update(v => !v);
  }

  toggleAppDialog() {
    this.showAppDialog.update(v => !v);
  }

  toggleDevDialog() {
    this.showDevDialog.update(v => !v);
  }

  // ============================================================
  // 🆕 BUSCADOR DE LÍNEAS
  // ============================================================
  selectRoute(route: Ruta) {
    this.routeService.selectRoute(route.id);
    this.showLineSearch.set(false);
    this.routeService.filters.update(f => ({...f, search: ''}));
  }

  // ============================================================
  // 🆕 AGREGAR LUGAR
  // ============================================================
  openAddLugarModal() {
    this.showAddLugarModal.set(true);
  }

  closeAddLugarModal() {
    this.showAddLugarModal.set(false);
    this.newLugarNombre = '';
    this.newLugarCiudad = '';
    this.newLugarLat = -16.5000;
    this.newLugarLng = -68.1300;
    this.newLugarDesc = '';
  }

  saveLugar() {
    if (!this.newLugarNombre.trim() || !this.newLugarCiudad.trim()) {
      this.gamificationService.notification.set('⚠️ Nombre y ciudad son obligatorios');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }

    const newLugar: Lugar = {
      id: Date.now() + Math.random() * 1000,
      nombre: this.newLugarNombre.trim(),
      ciudad: this.newLugarCiudad.trim(),
      latitud: this.newLugarLat || -16.5000,
      longitud: this.newLugarLng || -68.1300,
      descripcion: this.newLugarDesc.trim() || undefined
    };

    this.lugares = [newLugar, ...this.lugares];
    this.gamificationService.notification.set(`✅ Lugar "${newLugar.nombre}" agregado`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.closeAddLugarModal();
  }

  // ============================================================
  // 💾 GUARDAR / CANCELAR
  // ============================================================
  handleSaveRoute(route: Ruta) {
    this.routeService.saveRoute(route);
  }

  handleCancelEdit() {
    this.routeService.cancelEditing();
    this.mapPolyline.set('');
    this.mapStops.set([]);
    this.mapColor.set('#3B82F6');
    this.editorDirection.set('ida');
  }

  // ============================================================
  // 🏷️ UTILIDADES
  // ============================================================
  getTransitName(route: Ruta): string {
    if (route.tipoTransporteNombre) {
      return route.tipoTransporteNombre;
    }
    const map: Record<number, string> = {
      1: 'Minibús',
      2: 'Trufi',
      3: 'Teleférico',
      4: 'PumaKatari',
      5: 'Micro'
    };
    return map[route.tipoTransporteId] || `Tipo ${route.tipoTransporteId}`;
  }
}