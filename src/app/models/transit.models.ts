export interface Lugar {
  id: number;
  nombre: string;
  ciudad: string;           // La Paz, El Alto, Cochabamba, etc.
  latitud: number;
  longitud: number;
  descripcion?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
// ============================================================
// 1. PARADA (coincide con ParadaDto)
// ============================================================
export interface Parada {
  id?: number;            // opcional para creación
  nombre: string;
  orden: number;
  latitud: number;
  longitud: number;
}

// ============================================================
// 2. SINDICATO (coincide con SindicatoDto)
// ============================================================
export interface Sindicato {
  id: number;
  nombre: string;
  descripcion?: string;
  active?: boolean;       // viene de BaseEntity
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// 3. TIPO DE TRANSPORTE (coincide con TipoTransporteDto)
// ============================================================
export interface TipoTransporte {
  id: number;
  nombre: string;         // minibus, trufi, teleferico, bus, micro
  icono?: string;         // 🚌, 🚐, 🚠
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// 4. USUARIO (coincide con UsuarioDto)
// ============================================================
export interface Usuario {
  id: number;
  googleSub: string;
  email: string;
  name: string;
  pictureUrl?: string;
  role: 'USER' | 'ADMIN'; // según tu backend, puede haber más roles
  puntosTotales?: number;
  estrellas?: number;
  nivel?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// 5. RUTA (coincide con RutaDto + relaciones)
// ============================================================
export interface Ruta {
  id: number;
  sindicatoId: number;           // solo ID para creación/actualización
  tipoTransporteId: number;      // solo ID para creación/actualización
  codigo: string;
  nombreRuta: string;
  color: string;                 // hexadecimal #FF0000
  polylineIda: string;           // polyline codificado o GeoJSON
  polylineVuelta?: string;
  distanciaKm?: number;
  duracionMin?: number;
  intervaloMin?: number;
  estado: 'activo' | 'mantenimiento' | 'suspendido';
  numeroParadas?: number;
  paradas?: Parada[];            // lista de paradas (opcional en POST/PUT)
  paradasVuelta?: Parada[];            // lista de paradas (opcional en POST/PUT)
  createdAt?: string;
  updatedAt?: string;
  versionActual?: number;
  // Campos adicionales que puede devolver el backend en listados (proyecciones)
  sindicatoNombre?: string;
  tipoTransporteNombre?: string;
  // Si el backend devuelve objetos completos (en lugar de solo IDs)
  sindicato?: Sindicato;
  tipoTransporte?: TipoTransporte;
  creador?: Usuario;
}

// ============================================================
// 6. RUTA HISTORIAL (coincide con RutaHistorial)
// ============================================================
export interface RutaHistorial {
  id: number;
  rutaId: number;
  version: number;
  // Datos de la ruta en esa versión (copia)
  sindicatoId: number;
  tipoTransporteId: number;
  nombreRuta: string;
  color: string;
  polylineIda: string;
  polylineVuelta?: string;
  paradasJson?: string;          // JSON con lista de ParadaDto
  distanciaKm?: number;
  duracionMin?: number;
  intervaloMin?: number;
  estado: 'activo' | 'mantenimiento' | 'suspendido';
  numeroParadas?: number;
  // Metadatos de la versión
  modificadoPor: string;         // nombre del usuario
  comentario: string;            // descripción del cambio
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  // Opcional: si quieres parsear paradasJson a objeto
  paradas?: Parada[];
}

// ============================================================
// 7. COMENTARIO (coincide con ComentarioDto + entidad)
// ============================================================
export interface Comentario {
  id: number;
  rutaId: number;
  usuarioId: number;
  comentario: string;
  puntuacion?: number;           // 1-5
  // Datos del usuario (si vienen en proyección)
  usuarioNombre?: string;
  usuarioEmail?: string;
  fechaFormateada?: string;
  cantidadMegustas?: number;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

// ============================================================
// 8. COLABORACIÓN (coincide con Colaboracion + proyección)
// ============================================================
export interface Colaboracion {
  id: number;
  usuarioId: number;
  rutaId: number;
  accion: 'crear' | 'editar' | 'corregir';
  puntosOtorgados: number;
  versionAfectada?: number;
  // Datos adicionales de proyección
  usuarioNombre?: string;
  rutaNombre?: string;
  fechaFormateada?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

// ============================================================
// 9. PUNTOS USUARIO (gamificación)
// ============================================================
export interface PuntosUsuario {
  id: number;
  usuarioId: number;
  puntosTotales: number;
  estrellas: number;
  nivel: string;                // Novato, Colaborador, Experto, Maestro
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

// ============================================================
// 10. PROYECCIONES PARA LISTADOS (resúmenes)
// ============================================================

/** Resumen de ruta para listados (RutaResumenProjection) */
export interface RutaResumen {
  id: number;
  nombreRuta: string;
  sindicatoNombre: string;
  tipoTransporteNombre: string;
  color: string;
  promedioPuntuacion: number;
  numeroComentarios: number;
}

/** Resumen de sindicato (SindicatoResumenProjection) */
export interface SindicatoResumen {
  id: number;
  nombre: string;
  numeroRutas: number;
  promedioPuntuacion: number;
}

/** Resumen de usuario (UsuarioResumenProjection) */
export interface UsuarioResumen {
  id: number;
  nombre: string;
  email: string;
  role: string;
  puntosTotales: number;
  estrellas: number;
  nivel: string;
  fechaRegistro: string;
  totalColaboraciones: number;
}

/** Resumen de colaboración (ColaboracionResumenProjection) */
export interface ColaboracionResumen {
  id: number;
  accion: string;
  puntosOtorgados: number;
  versionAfectada?: number;
  fechaFormateada: string;
  usuarioNombre: string;
  rutaNombre: string;
  rutaId: number;
}

/** Resumen de comentario (ComentarioResumenProjection) */
export interface ComentarioResumen {
  id: number;
  contenido: string;
  puntuacion: number;
  usuarioNombre: string;
  rutaNombre: string;
  fechaFormateada: string;
  cantidadMegustas: number;
}

// ============================================================
// 11. PAGINACIÓN (para respuestas del backend)
// ============================================================
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================================
// 12. FILTROS Y SOLICITUDES
// ============================================================

/** Filtros para listar rutas */
export interface RutaFilter {
  search?: string;
  estado?: 'activo' | 'mantenimiento' | 'suspendido' | 'todos';
  sindicatoId?: number;
  tipoTransporteId?: number;
  page?: number;
  size?: number;
  sort?: string;               // ej: "nombreRuta,asc"
}

/** DTO para crear/actualizar ruta (RutaDto) */
export interface RutaRequest {
  sindicatoId: number;
  tipoTransporteId: number;
  nombreRuta: string;
  color?: string;
  polylineIda: string;
  polylineVuelta?: string;
  distanciaKm?: number;
  duracionMin?: number;
  intervaloMin?: number;
  estado?: 'activo' | 'mantenimiento' | 'suspendido';
  numeroParadas?: number;
  paradas?: Parada[];
}

/** DTO para crear comentario (ComentarioDto) */
export interface ComentarioRequest {
  rutaId: number;
  comentario: string;
  puntuacion?: number;
}

/** DTO para login con Google (GoogleLoginRequest) */
export interface GoogleLoginRequest {
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
}

// ============================================================
// 13. RESPUESTA GLOBAL (si usas TransactionResponse)
// ============================================================
export interface TransactionResponse<T> {
  transaction: boolean;
  data: T | null;
  message: string;
  timestamp: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// 14. CONSTANTES ÚTILES (opcional)
// ============================================================
export const ESTADOS_RUTA = ['activo', 'mantenimiento', 'suspendido'] as const;
export type EstadoRuta = typeof ESTADOS_RUTA[number];

export const NIVELES_USUARIO = ['Novato', 'Colaborador', 'Experto', 'Maestro'] as const;
export type NivelUsuario = typeof NIVELES_USUARIO[number];

export const ACCIONES_COLABORACION = ['crear', 'editar', 'corregir'] as const;
export type AccionColaboracion = typeof ACCIONES_COLABORACION[number];