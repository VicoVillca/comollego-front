// ============================================================
// 1. INTERFACES EXISTENTES (MANTENEMOS PARA COMPATIBILIDAD)
// ============================================================

export interface Sindicato {
  id: number;
  nombre: string;
  descripcion?: string;
  active?: boolean;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface TipoTransporte {
  id: number;
  nombre: string;
  icono?: string;
  active?: boolean;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface Parada {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  orden?: number;
  sentido?: 'IDA' | 'VUELTA';
  active?: boolean;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface Ruta {
  id: number;
  sindicatoId: number;
  tipoTransporteId: number;
  codigo: string;
  nombreRuta: string;
  color: string;
  polylineIda: string;
  polylineVuelta?: string;
  distanciaKm: number;
  duracionMin: number;
  intervaloMin: number;
  // ✅ IMPORTANTE: estado debe existir para el componente route-list
  estado: 'activo' | 'mantenimiento' | 'suspendido';
  numeroParadas?: number;
  paradas: Parada[];
  paradasVuelta: Parada[];
  // Campos adicionales para UI
  sindicatoNombre?: string;
  tipoTransporteNombre?: string;
  // Auditoría
  createdAt?: string;
  updatedAt?: string;
  versionActual?: number;
}

// ============================================================
// 2. INTERFACES PARA RESPUESTAS DEL BACKEND
// ============================================================

export interface RutaBackendResponse {
  id: number;
  codigo: string;
  nombreRuta: string;
  color: string;
  polylineIda: string;
  polylineVuelta?: string | null;
  distanciaKm: number | null;
  duracionMin: number;
  intervaloMin: number;
  estado: 'ACTIVO' | 'MANTENIMIENTO' | 'SUSPENDIDO';
  versionActual: number;
  // Objetos anidados
  sindicato: {
    id: number;
    nombre: string;
    descripcion?: string;
    active?: boolean;
  };
  tipoTransporte: {
    id: number;
    nombre: string;
    icono?: string;
    active?: boolean;
  };
  creador?: {
    id: number;
    email: string;
    name: string;
    pictureUrl?: string;
    role?: string;
  };
  // Paradas (ya son del tipo Parada, no necesitan casteo)
  paradasIda: Parada[];
  paradasVuelta: Parada[];
  // Auditoría
  active?: boolean;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

// ============================================================
// 3. INTERFACES PARA ENVIAR AL BACKEND
// ============================================================

export interface RutaDto {
  id?: number;
  sindicatoId: number;
  tipoTransporteId: number;
  nombreRuta: string;
  codigo: string;
  color: string;
  polylineIda: string;
  polylineVuelta?: string | null;
  distanciaKm: number | null;
  duracionMin: number;
  intervaloMin: number;
  paradasIda: ParadaDto[];
  paradasVuelta: ParadaDto[];
}

export interface ParadaDto {
  nombre: string;
  latitud: number;
  longitud: number;
}

// ============================================================
// 4. FUNCIONES ADAPTADORAS
// ============================================================

/**
 * Convierte una respuesta del backend a una Ruta del frontend
 */
export function toFrontendRuta(backend: RutaBackendResponse): Ruta {
  return {
    id: backend.id,
    sindicatoId: backend.sindicato?.id || 0,
    tipoTransporteId: backend.tipoTransporte?.id || 0,
    codigo: backend.codigo,
    nombreRuta: backend.nombreRuta,
    color: backend.color,
    polylineIda: backend.polylineIda,
    polylineVuelta: backend.polylineVuelta || "",
    distanciaKm: backend.distanciaKm || 0,
    duracionMin: backend.duracionMin,
    intervaloMin: backend.intervaloMin,
    estado: 'activo',
    numeroParadas: (backend.paradasIda?.length || 0) + (backend.paradasVuelta?.length || 0),
    // ✅ CORRECTO: Separar por sentido
    paradas: backend.paradasIda || [],  // IDA
    paradasVuelta: backend.paradasVuelta || [],  // VUELTA
    sindicatoNombre: backend.sindicato?.nombre,
    tipoTransporteNombre: backend.tipoTransporte?.nombre,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    versionActual: backend.versionActual
  };
}

/**
 * Convierte una Ruta del frontend a un RutaDto para el backend
 */
export function toBackendRutaDto(frontend: Partial<Ruta>): RutaDto {
  // Transformar paradas al formato DTO (sin id, sin orden, sin sentido)
    console.log("vicovilclca front")
  console.log(frontend.paradas?.length)
  const paradasIda = (frontend.paradas || [])
    .filter(p => p.nombre?.trim())
    .map(p => ({
      nombre: p.nombre,
      latitud: p.latitud,
      longitud: p.longitud
    }));

    console.log("vicovilclca front2")
  console.log(paradasIda.length)

  const paradasVuelta = (frontend.paradasVuelta || [])
    .filter(p => p.nombre?.trim())
    .map(p => ({
      nombre: p.nombre,
      latitud: p.latitud,
      longitud: p.longitud
    }));

  return {
    id: frontend.id,
    sindicatoId: frontend.sindicatoId || 1,
    tipoTransporteId: frontend.tipoTransporteId || 1,
    nombreRuta: frontend.nombreRuta || '',
    codigo: frontend.codigo || '',
    color: frontend.color || '#3b82f6',
    polylineIda: frontend.polylineIda || '',
    polylineVuelta: frontend.polylineVuelta || null,
    distanciaKm: frontend.distanciaKm || null,
    duracionMin: frontend.duracionMin || 0,
    intervaloMin: frontend.intervaloMin || 5,
    paradasIda: paradasIda,
    paradasVuelta: paradasVuelta
  };
}

/**
 * Convierte múltiples rutas del backend al frontend
 */
export function toFrontendRutas(backendList: RutaBackendResponse[]): Ruta[] {
  return backendList.map(r => toFrontendRuta(r));
}

// ============================================================
// 5. OTRAS INTERFACES DE RESPUESTA
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  messages?: string[];
  timestamp?: string;
  path?: string | null;
}

export interface PageableResponse<T> {
  success: boolean;
  data: {
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  messages?: string[];
}

export interface RutaFilter {
  search?: string;
  estado?: 'todos' | 'activo' | 'mantenimiento' | 'suspendido';
  sindicatoId?: number;
  tipoTransporteId?: number;
}

export interface Comentario {
  id: number;
  rutaId: number;
  usuarioId: number;
  comentario: string;
  puntuacion: number;
  usuarioNombre: string;
  fechaFormateada: string;
  createdAt: string;
  active: boolean;
}

export interface RutaHistorial {
  id: number;
  rutaId: number;
  version: number;
  sindicatoId: number;
  tipoTransporteId: number;
  nombreRuta: string;
  color: string;
  polylineIda: string;
  polylineVuelta?: string;
  distanciaKm: number;
  duracionMin: number;
  intervaloMin: number;
  estado: string;
  numeroParadas: number;
  paradasJson: string;
  modificadoPor: string;
  comentario: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface Lugar {
  id: number;
  nombre: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}




export interface Comentario {
  id: number;
  rutaId: number;
  usuarioId: number;
  comentario: string;
  puntuacion: number;
  usuarioNombre: string;
  usuarioEmail?: string; // ✅ AGREGAMOS esta propiedad
  fechaFormateada: string;
  createdAt: string;
  active: boolean;
}