# 🗺️ Comollego - Transporte Público en Bolivia

Aplicación web para visualizar y colaborar en rutas de transporte público en Bolivia. Los usuarios pueden ver líneas de minibuses, trufis, teleférico y micros, así como agregar nuevos lugares y reportar incidentes.

---

## 🚀 Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | v17+ | Framework frontend |
| **PrimeNG** | v17+ | Componentes UI |
| **PrimeIcons** | v6+ | Iconos |
| **Leaflet** | v1.9+ | Mapas interactivos |
| **TypeScript** | v5+ | Lenguaje principal |
| **Google Identity Services** | - | Login con Google |

---

## 📂 Estructura del Proyecto

src/
├── app/
│ ├── core/ # Núcleo de la aplicación
│ │ ├── auth/ # Autenticación
│ │ │ ├── auth.service.ts # Login/logout, estado del usuario
│ │ │ ├── auth.guard.ts # Protege rutas
│ │ │ ├── auth.interceptor.ts # Agrega token a peticiones HTTP
│ │ │ └── login/ # Componente de login
│ │ │ ├── login.component.ts
│ │ │ ├── login.component.html
│ │ │ └── login.component.css
│ │ ├── models/ # Modelos y tipos
│ │ │ └── transit.models.ts
│ │ └── services/ # Servicios globales
│ │ ├── route.service.ts # CRUD de rutas
│ │ ├── gamification.service.ts # Puntos y niveles
│ │ └── simulation.service.ts # Simulación de viajes
│ │
│ ├── features/ # Características principales
│ │ ├── map/ # Componente del mapa
│ │ │ ├── map.component.ts
│ │ │ ├── map.component.html
│ │ │ └── map.component.css
│ │ └── routes/ # Gestión de rutas
│ │ ├── route-details/ # Card de detalles de ruta
│ │ ├── route-editor/ # Editor de rutas
│ │ └── route-list/ # Lista de rutas
│ │
│ ├── layouts/ # Layouts de la aplicación
│ │ ├── main-layout/ # Layout principal (con mapa)
│ │ └── auth-layout/ # Layout de login (sin mapa)
│ │
│ ├── shared/ # Componentes reutilizables
│ │ ├── components/ # Componentes compartidos
│ │ │ ├── floating-buttons/ # Botones flotantes (Líneas, App, Devs)
│ │ │ ├── user-profile/ # Modal de perfil de usuario
│ │ │ ├── lugar-search/ # Buscador de lugares
│ │ │ ├── line-search/ # Buscador de líneas
│ │ │ ├── app-dialog/ # Modal de descarga de app
│ │ │ └── dev-dialog/ # Modal de desarrolladores
│ │ ├── directives/ # Directivas reutilizables
│ │ ├── pipes/ # Pipes reutilizables
│ │ └── shared.module.ts # Módulo compartido
│ │
│ ├── data/ # Datos mock
│ │ └── mock-data.ts
│ │
│ ├── app.component.ts # Componente raíz (contenedor)
│ ├── app.component.html
│ ├── app.component.css
│ ├── app.config.ts # Configuración de la app
│ └── app.routes.ts # Rutas de la aplicación
│
├── environments/ # Variables de entorno
│ ├── environment.ts # Desarrollo
│ └── environment.prod.ts # Producción
│
├── index.html # Punto de entrada HTML
├── main.ts # Bootstrap de la app
└── styles.css # Estilos globales

---

## 🔄 Flujo de Autenticación

Usuario abre la app
↓

AuthGuard verifica si está logueado
↓

Si NO → Redirige a /login (LoginComponent)
↓

Usuario hace clic en "Iniciar sesión con Google"
↓

Google devuelve token JWT
↓

Frontend decodifica el token → obtiene { sub, email, name, picture }
↓

Envía al backend: POST /api/auth/google
↓

Backend guarda/actualiza usuario y devuelve { token: "jwt", user: {...} }
↓

Frontend guarda en localStorage:

    auth_token → JWT del backend

    user → { id, name, email, picture }
    ↓

Redirige a la página principal (/)
↓

AuthInterceptor agrega el token a todas las peticiones HTTP

---

## 🗺️ Componentes Principales

### 1. **MainLayout** (`layouts/main-layout/`)

- Contiene el mapa y todos los componentes principales
- Gestiona el estado del mapa (polyline, stops, color)
- Maneja los modales (perfil, líneas, app, desarrolladores)
- Buscador de lugares con sugerencias (como Google)

### 2. **Login** (`core/auth/login/`)

- Pantalla de inicio de sesión con Google
- Muestra spinner mientras se autentica
- Muestra mensajes de error

### 3. **Map** (`features/map/`)

- Renderiza el mapa con Leaflet
- Muestra polyline (ruta) y paradas
- Modo edición (arrastrar puntos, agregar paradas)
- Modo visualización (ver rutas)

### 4. **RouteDetails** (`features/routes/route-details/`)

- Card con información detallada de la ruta
- Muestra paradas (ida/vuelta)
- Comentarios y calificaciones
- Historial de versiones

### 5. **RouteEditor** (`features/routes/route-editor/`)

- Editor de rutas (crear/editar)
- Selector de color
- Gestión de paradas (agregar/eliminar)
- Cambio de dirección (ida/vuelta)

---

## 🔐 Variables de Entorno

### `environments/environment.ts` (Desarrollo)

export const environment = {
  production: false,
  googleClientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
  apiUrl: 'http://localhost:8080/api'
};