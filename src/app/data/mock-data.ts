// ============================================================
// 1. SINDICATOS (ID numérico)
// ============================================================
import { 
  Sindicato,
  TipoTransporte,
  Ruta,
  Comentario,
  RutaHistorial,
  Lugar
} from "../models/transit.models";

// ============================================================
export const SINDICATOS_MOCK: Sindicato[] = [
  { id: 1, nombre: 'Mi Teleférico S.A.', descripcion: 'Empresa Estatal de Transporte por Cable', active: true },
  { id: 2, nombre: 'Sindicato Eduardo Avaroa', descripcion: 'Tránsito urbano de Micros y Minibuses de La Paz', active: true },
  { id: 3, nombre: 'Sindicato Litoral de Transportes', descripcion: 'Líneas tradicionales que conectan la Zona Sur y el Centro', active: true },
  { id: 4, nombre: 'Sindicato San Cristóbal', descripcion: 'Flotas modernas y trufis express interbarrios', active: true },
  { id: 5, nombre: 'Sindicato 16 de Julio', descripcion: 'Servicio nocturno y de ladera alta', active: true }
];

// ============================================================
// 2. TIPOS DE TRANSPORTE
// ============================================================
export const TIPOS_TRANSPORTE_MOCK: TipoTransporte[] = [
  { id: 1, nombre: 'teleferico', icono: '🚠' },
  { id: 2, nombre: 'minibus', icono: '🚐' },
  { id: 3, nombre: 'micro', icono: '🚌' },
  { id: 4, nombre: 'trufi', icono: '🚗' },
  { id: 5, nombre: 'bus', icono: '🚍' }
];

// ============================================================
// 3. FUNCIÓN PARA GENERAR POLYLINE (simulada)
// ============================================================
// En un caso real usarías una librería como @mapbox/polyline.
// Aquí solo convertimos coordenadas a un string simple para mock.
function encodePolylineMock(coords: [number, number][]): string {
  // Simplemente concatenamos lat,lng con ';'
  return coords.map(([lat, lng]) => `${lat},${lng}`).join(';');
}

// ============================================================
// 4. RUTAS MOCK (usando los modelos en español)
// ============================================================
export const RUTAS_MOCK: Ruta[] = [
  // ============================================================
  // RUTA 1: Teleférico Línea Roja
  // ============================================================
  {
    id: 1,
    sindicatoId: 1,
    tipoTransporteId: 1,
    codigo: 'TRF-001',
    nombreRuta: 'Línea Roja (Estación Central - 16 de Julio)',
    color: '#E53E3E',
    
    // 🟥 IDA
    polylineIda: encodePolylineMock([
      [-16.4930, -68.1401],
      [-16.4935, -68.1435],
      [-16.4945, -68.1495],
      [-16.4938, -68.1560],
      [-16.4925, -68.1632]
    ]),
    paradas: [
      { id: 1, nombre: 'Estación Central (Taypi Uta)', orden: 1, latitud: -16.4930, longitud: -68.1401 },
      { id: 2, nombre: 'Estación Cementerio (Ajayuni)', orden: 2, latitud: -16.4945, longitud: -68.1495 },
      { id: 3, nombre: 'Estación 16 de Julio (Jach\'a Qhathu)', orden: 3, latitud: -16.4925, longitud: -68.1632 }
    ],
    
    // 🟩 VUELTA (invertida)
    polylineVuelta: encodePolylineMock([
      [-16.4925, -68.1632],
      [-16.4938, -68.1560],
      [-16.4945, -68.1495],
      [-16.4935, -68.1435],
      [-16.4930, -68.1401]
    ]),
    paradasVuelta: [
      { id: 4, nombre: 'Estación 16 de Julio (Jach\'a Qhathu)', orden: 1, latitud: -16.4925, longitud: -68.1632 },
      { id: 5, nombre: 'Estación Cementerio (Ajayuni)', orden: 2, latitud: -16.4945, longitud: -68.1495 },
      { id: 6, nombre: 'Estación Central (Taypi Uta)', orden: 3, latitud: -16.4930, longitud: -68.1401 }
    ],
    
    distanciaKm: 2.4,
    duracionMin: 10,
    intervaloMin: 2,
    estado: 'activo',
    numeroParadas: 3,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    versionActual: 2,
    sindicatoNombre: 'Mi Teleférico S.A.',
    tipoTransporteNombre: 'Teleférico'
  },

  // ============================================================
  // RUTA 2: Minibus 242
  // ============================================================
  {
    id: 2,
    sindicatoId: 3,
    tipoTransporteId: 2,
    codigo: '242',
    nombreRuta: 'Minibus 242 (Chasquipampa - Prado - Plaza San Pedro)',
    color: '#0D9488',
    
    // 🟥 IDA
    polylineIda: encodePolylineMock([
      [-16.5360, -68.0676],
      [-16.5310, -68.0730],
      [-16.5242, -68.0820],
      [-16.5200, -68.0960],
      [-16.5180, -68.1130],
      [-16.5080, -68.1250],
      [-16.4996, -68.1344],
      [-16.4988, -68.1396]
    ]),
    paradas: [
      { id: 7, nombre: 'Paradero Chasquipampa', orden: 1, latitud: -16.5360, longitud: -68.0676 },
      { id: 8, nombre: 'Calle 21 Calacoto', orden: 2, latitud: -16.5242, longitud: -68.0820 },
      { id: 9, nombre: 'Obrajes Calle 8', orden: 3, latitud: -16.5180, longitud: -68.1130 },
      { id: 10, nombre: 'El Prado (Monumento Colón)', orden: 4, latitud: -16.4996, longitud: -68.1344 },
      { id: 11, nombre: 'Plaza San Pedro', orden: 5, latitud: -16.4988, longitud: -68.1396 }
    ],
    
    // 🟩 VUELTA (invertida)
    polylineVuelta: encodePolylineMock([
      [-16.4988, -68.1396],
      [-16.4996, -68.1344],
      [-16.5080, -68.1250],
      [-16.5180, -68.1130],
      [-16.5200, -68.0960],
      [-16.5242, -68.0820],
      [-16.5310, -68.0730],
      [-16.5360, -68.0676]
    ]),
    paradasVuelta: [
      { id: 12, nombre: 'Plaza San Pedro', orden: 1, latitud: -16.4988, longitud: -68.1396 },
      { id: 13, nombre: 'El Prado (Monumento Colón)', orden: 2, latitud: -16.4996, longitud: -68.1344 },
      { id: 14, nombre: 'Obrajes Calle 8', orden: 3, latitud: -16.5180, longitud: -68.1130 },
      { id: 15, nombre: 'Calle 21 Calacoto', orden: 4, latitud: -16.5242, longitud: -68.0820 },
      { id: 16, nombre: 'Paradero Chasquipampa', orden: 5, latitud: -16.5360, longitud: -68.0676 }
    ],
    
    distanciaKm: 14.5,
    duracionMin: 50,
    intervaloMin: 3,
    estado: 'activo',
    numeroParadas: 5,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
    versionActual: 1,
    sindicatoNombre: 'Sindicato Litoral de Transportes',
    tipoTransporteNombre: 'Minibús'
  },

  // ============================================================
  // RUTA 3: Micro 42
  // ============================================================
  {
    id: 3,
    sindicatoId: 2,
    tipoTransporteId: 3,
    codigo: '42',
    nombreRuta: 'Micro 42 (Miraflores - Prado - Cementerio General)',
    color: '#0284C7',
    
    // 🟥 IDA
    polylineIda: encodePolylineMock([
      [-16.4891, -68.1215],
      [-16.4920, -68.1220],
      [-16.4962, -68.1235],
      [-16.4975, -68.1270],
      [-16.4980, -68.1305],
      [-16.4996, -68.1344],
      [-16.4980, -68.1380],
      [-16.4950, -68.1444],
      [-16.4940, -68.1500]
    ]),
    paradas: [
      { id: 17, nombre: 'Plaza Villarroel (Miraflores)', orden: 1, latitud: -16.4891, longitud: -68.1215 },
      { id: 18, nombre: 'Hospital de Clínicas', orden: 2, latitud: -16.4962, longitud: -68.1235 },
      { id: 19, nombre: 'Monumento Busch', orden: 3, latitud: -16.4980, longitud: -68.1305 },
      { id: 20, nombre: 'El Prado', orden: 4, latitud: -16.4996, longitud: -68.1344 },
      { id: 21, nombre: 'Plaza Garita de Lima', orden: 5, latitud: -16.4950, longitud: -68.1444 },
      { id: 22, nombre: 'Cementerio General', orden: 6, latitud: -16.4940, longitud: -68.1500 }
    ],
    
    // 🟩 VUELTA
    polylineVuelta: encodePolylineMock([
      [-16.4940, -68.1500],
      [-16.4950, -68.1444],
      [-16.4980, -68.1380],
      [-16.4996, -68.1344],
      [-16.4980, -68.1305],
      [-16.4975, -68.1270],
      [-16.4962, -68.1235],
      [-16.4920, -68.1220],
      [-16.4891, -68.1215]
    ]),
    paradasVuelta: [
      { id: 23, nombre: 'Cementerio General', orden: 1, latitud: -16.4940, longitud: -68.1500 },
      { id: 24, nombre: 'Plaza Garita de Lima', orden: 2, latitud: -16.4950, longitud: -68.1444 },
      { id: 25, nombre: 'El Prado', orden: 3, latitud: -16.4996, longitud: -68.1344 },
      { id: 26, nombre: 'Monumento Busch', orden: 4, latitud: -16.4980, longitud: -68.1305 },
      { id: 27, nombre: 'Hospital de Clínicas', orden: 5, latitud: -16.4962, longitud: -68.1235 },
      { id: 28, nombre: 'Plaza Villarroel (Miraflores)', orden: 6, latitud: -16.4891, longitud: -68.1215 }
    ],
    
    distanciaKm: 8.2,
    duracionMin: 35,
    intervaloMin: 6,
    estado: 'activo',
    numeroParadas: 6,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    versionActual: 1,
    sindicatoNombre: 'Sindicato Eduardo Avaroa',
    tipoTransporteNombre: 'Micro'
  },

  // ============================================================
  // RUTA 4: Trufi Prado 30
  // ============================================================
  {
    id: 4,
    sindicatoId: 4,
    tipoTransporteId: 4,
    codigo: '30',
    nombreRuta: 'Trufi 30 (San Miguel - Prado - Pérez Velasco)',
    color: '#D97706',
    
    // 🟥 IDA
    polylineIda: encodePolylineMock([
      [-16.5262, -68.0772],
      [-16.5270, -68.0905],
      [-16.5180, -68.1050],
      [-16.5100, -68.1180],
      [-16.5034, -68.1305],
      [-16.4996, -68.1344],
      [-16.4952, -68.1370]
    ]),
    paradas: [
      { id: 29, nombre: 'Iglesia San Miguel', orden: 1, latitud: -16.5262, longitud: -68.0772 },
      { id: 30, nombre: 'Plaza Humboldt', orden: 2, latitud: -16.5270, longitud: -68.0905 },
      { id: 31, nombre: 'Kantutani Entrada', orden: 3, latitud: -16.5100, longitud: -68.1180 },
      { id: 32, nombre: 'Plaza del Estudiante', orden: 4, latitud: -16.5034, longitud: -68.1305 },
      { id: 33, nombre: 'Plaza Pérez Velasco', orden: 5, latitud: -16.4952, longitud: -68.1370 }
    ],
    
    // 🟩 VUELTA
    polylineVuelta: encodePolylineMock([
      [-16.4952, -68.1370],
      [-16.4996, -68.1344],
      [-16.5034, -68.1305],
      [-16.5100, -68.1180],
      [-16.5180, -68.1050],
      [-16.5270, -68.0905],
      [-16.5262, -68.0772]
    ]),
    paradasVuelta: [
      { id: 34, nombre: 'Plaza Pérez Velasco', orden: 1, latitud: -16.4952, longitud: -68.1370 },
      { id: 35, nombre: 'Plaza del Estudiante', orden: 2, latitud: -16.5034, longitud: -68.1305 },
      { id: 36, nombre: 'Kantutani Entrada', orden: 3, latitud: -16.5100, longitud: -68.1180 },
      { id: 37, nombre: 'Plaza Humboldt', orden: 4, latitud: -16.5270, longitud: -68.0905 },
      { id: 38, nombre: 'Iglesia San Miguel', orden: 5, latitud: -16.5262, longitud: -68.0772 }
    ],
    
    distanciaKm: 10.5,
    duracionMin: 30,
    intervaloMin: 4,
    estado: 'mantenimiento',
    numeroParadas: 5,
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: '2026-05-20T00:00:00Z',
    versionActual: 1,
    sindicatoNombre: 'Sindicato San Cristóbal',
    tipoTransporteNombre: 'Trufi'
  },

  // ============================================================
  // RUTA 5: Línea Verde (Teleférico)
  // ============================================================
  {
    id: 5,
    sindicatoId: 1,
    tipoTransporteId: 1,
    codigo: 'TRF-002',
    nombreRuta: 'Línea Verde (Estación Irpavi - Estación Delicias)',
    color: '#22C55E',
    
    // 🟥 IDA
    polylineIda: encodePolylineMock([
      [-16.5230, -68.0840],
      [-16.5250, -68.0900],
      [-16.5280, -68.0980],
      [-16.5300, -68.1050],
      [-16.5320, -68.1120]
    ]),
    paradas: [
      { id: 39, nombre: 'Estación Irpavi', orden: 1, latitud: -16.5230, longitud: -68.0840 },
      { id: 40, nombre: 'Estación Libertador', orden: 2, latitud: -16.5280, longitud: -68.0980 },
      { id: 41, nombre: 'Estación Delicias', orden: 3, latitud: -16.5320, longitud: -68.1120 }
    ],
    
    // 🟩 VUELTA
    polylineVuelta: encodePolylineMock([
      [-16.5320, -68.1120],
      [-16.5300, -68.1050],
      [-16.5280, -68.0980],
      [-16.5250, -68.0900],
      [-16.5230, -68.0840]
    ]),
    paradasVuelta: [
      { id: 42, nombre: 'Estación Delicias', orden: 1, latitud: -16.5320, longitud: -68.1120 },
      { id: 43, nombre: 'Estación Libertador', orden: 2, latitud: -16.5280, longitud: -68.0980 },
      { id: 44, nombre: 'Estación Irpavi', orden: 3, latitud: -16.5230, longitud: -68.0840 }
    ],
    
    distanciaKm: 3.2,
    duracionMin: 12,
    intervaloMin: 3,
    estado: 'activo',
    numeroParadas: 3,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    versionActual: 1,
    sindicatoNombre: 'Mi Teleférico S.A.',
    tipoTransporteNombre: 'Teleférico'
  }
];

// ============================================================
// 5. COMENTARIOS MOCK (asociados a rutas)
// ============================================================
export const COMENTARIOS_MOCK: Comentario[] = [
  {
    id: 1,
    rutaId: 1,
    usuarioId: 1,
    comentario: 'La opción más rápida para subir a El Alto el día de la feria 16 de julio. Recomendado!',
    puntuacion: 5,
    usuarioNombre: 'Wara Flores',
    fechaFormateada: '2026-06-18',
    createdAt: '2026-06-18T00:00:00Z',
    active: true
  },
  {
    id: 2,
    rutaId: 1,
    usuarioId: 2,
    comentario: 'A veces hay filas largas a las 6 pm, pero la vista del Nevado Illimani es inigualable.',
    puntuacion: 4,
    usuarioNombre: 'Carlos Condori',
    fechaFormateada: '2026-06-20',
    createdAt: '2026-06-20T00:00:00Z',
    active: true
  },
  {
    id: 3,
    rutaId: 2,
    usuarioId: 3,
    comentario: 'Conecta la Zona Sur súper rápido, aunque a veces van muy rápido. Ojo con el paso por la Curva de Holguín.',
    puntuacion: 4,
    usuarioNombre: 'René Quispe',
    fechaFormateada: '2026-06-15',
    createdAt: '2026-06-15T00:00:00Z',
    active: true
  },
  {
    id: 4,
    rutaId: 3,
    usuarioId: 4,
    comentario: 'Un viaje nostálgico, la tarifa es muy barata y tiene harto espacio para llevar bultos.',
    puntuacion: 4,
    usuarioNombre: 'Mariela Alarcón',
    fechaFormateada: '2026-06-19',
    createdAt: '2026-06-19T00:00:00Z',
    active: true
  },
  {
    id: 5,
    rutaId: 4,
    usuarioId: 5,
    comentario: 'Es muy cómodo porque viajas sentado obligatoriamente. Pero en horas pico cuesta conseguir uno vacío.',
    puntuacion: 4,
    usuarioNombre: 'Gabriel Siles',
    fechaFormateada: '2026-06-21',
    createdAt: '2026-06-21T00:00:00Z',
    active: true
  }
];

// ============================================================
// 6. HISTORIAL DE VERSIONES MOCK (RutaHistorial)
// ============================================================
export const HISTORIAL_MOCK: RutaHistorial[] = [
  // Para ruta 1 (Línea Roja) - versión 1
  {
    id: 1,
    rutaId: 1,
    version: 1,
    sindicatoId: 1,
    tipoTransporteId: 1,
    nombreRuta: 'Línea Roja (Estación Central - 16 de Julio)',
    color: '#E53E3E',
    polylineIda: encodePolylineMock([
      [-16.4930, -68.1401],
      [-16.4925, -68.1632]
    ]),
    polylineVuelta: undefined,
    distanciaKm: 2.0,
    duracionMin: 8,
    intervaloMin: 2,
    estado: 'activo',
    numeroParadas: 2,
    paradasJson: JSON.stringify([
      { nombre: 'Estación Central (Taypi Uta)', orden: 1, latitud: -16.4930, longitud: -68.1401 },
      { nombre: 'Estación 16 de Julio (Jach\'a Qhathu)', orden: 2, latitud: -16.4925, longitud: -68.1632 }
    ]),
    modificadoPor: 'vicovillca@gmail.com',
    comentario: 'Trazado original para la inauguración de la línea',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    active: true
  },
  // Para ruta 1 - versión 2 (actual)
  {
    id: 2,
    rutaId: 1,
    version: 2,
    sindicatoId: 1,
    tipoTransporteId: 1,
    nombreRuta: 'Línea Roja (Estación Central - 16 de Julio)',
    color: '#E53E3E',
    polylineIda: encodePolylineMock([
      [-16.4930, -68.1401],
      [-16.4935, -68.1435],
      [-16.4945, -68.1495],
      [-16.4938, -68.1560],
      [-16.4925, -68.1632]
    ]),
    polylineVuelta: undefined,
    distanciaKm: 2.4,
    duracionMin: 10,
    intervaloMin: 2,
    estado: 'activo',
    numeroParadas: 3,
    paradasJson: JSON.stringify([
      { nombre: 'Estación Central (Taypi Uta)', orden: 1, latitud: -16.4930, longitud: -68.1401 },
      { nombre: 'Estación Cementerio (Ajayuni)', orden: 2, latitud: -16.4945, longitud: -68.1495 },
      { nombre: 'Estación 16 de Julio (Jach\'a Qhathu)', orden: 3, latitud: -16.4925, longitud: -68.1632 }
    ]),
    modificadoPor: 'admin@comollego.org',
    comentario: 'Se añadió la Estación Cementerio intermedia en el archivo de paradas JSON',
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    active: true
  },
  // Para ruta 2 - versión 1 (única)
  {
    id: 3,
    rutaId: 2,
    version: 1,
    sindicatoId: 3,
    tipoTransporteId: 2,
    nombreRuta: 'Minibus 242 (Chasquipampa - Prado - Plaza San Pedro)',
    color: '#0D9488',
    polylineIda: encodePolylineMock([
      [-16.5360, -68.0676],
      [-16.5310, -68.0730],
      [-16.5242, -68.0820],
      [-16.5200, -68.0960],
      [-16.5180, -68.1130],
      [-16.5080, -68.1250],
      [-16.4996, -68.1344],
      [-16.4988, -68.1396]
    ]),
    polylineVuelta: undefined,
    distanciaKm: 14.5,
    duracionMin: 50,
    intervaloMin: 3,
    estado: 'activo',
    numeroParadas: 5,
    paradasJson: JSON.stringify([
      { nombre: 'Paradero Chasquipampa', orden: 1, latitud: -16.5360, longitud: -68.0676 },
      { nombre: 'Calle 21 Calacoto', orden: 2, latitud: -16.5242, longitud: -68.0820 },
      { nombre: 'Obrajes Calle 8', orden: 3, latitud: -16.5180, longitud: -68.1130 },
      { nombre: 'El Prado (Monumento Colón)', orden: 4, latitud: -16.4996, longitud: -68.1344 },
      { nombre: 'Plaza San Pedro', orden: 5, latitud: -16.4988, longitud: -68.1396 }
    ]),
    modificadoPor: 'p.flores@vico.com',
    comentario: 'Versión inicial de paradas y terminales fijas',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
    active: true
  },
  // Para ruta 3 - versión 1
  {
    id: 4,
    rutaId: 3,
    version: 1,
    sindicatoId: 2,
    tipoTransporteId: 3,
    nombreRuta: 'Micro 42 (Miraflores - Prado - Cementerio General)',
    color: '#0284C7',
    polylineIda: encodePolylineMock([
      [-16.4891, -68.1215],
      [-16.4920, -68.1220],
      [-16.4962, -68.1235],
      [-16.4975, -68.1270],
      [-16.4980, -68.1305],
      [-16.4996, -68.1344],
      [-16.4980, -68.1380],
      [-16.4950, -68.1444],
      [-16.4940, -68.1500]
    ]),
    polylineVuelta: undefined,
    distanciaKm: 8.2,
    duracionMin: 35,
    intervaloMin: 6,
    estado: 'activo',
    numeroParadas: 6,
    paradasJson: JSON.stringify([
      { nombre: 'Plaza Villarroel (Miraflores)', orden: 1, latitud: -16.4891, longitud: -68.1215 },
      { nombre: 'Hospital de Clínicas', orden: 2, latitud: -16.4962, longitud: -68.1235 },
      { nombre: 'Monumento Busch', orden: 3, latitud: -16.4980, longitud: -68.1305 },
      { nombre: 'El Prado', orden: 4, latitud: -16.4996, longitud: -68.1344 },
      { nombre: 'Plaza Garita de Lima', orden: 5, latitud: -16.4950, longitud: -68.1444 },
      { nombre: 'Cementerio General', orden: 6, latitud: -16.4940, longitud: -68.1500 }
    ]),
    modificadoPor: 'test@comollego.org',
    comentario: 'Registro de ruta histórica patrimonial de La Paz',
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    active: true
  },
  // Para ruta 4 - versión 1
  {
    id: 5,
    rutaId: 4,
    version: 1,
    sindicatoId: 4,
    tipoTransporteId: 4,
    nombreRuta: 'Trufi Prado 30 (San Miguel - Prado - Pérez Velasco)',
    color: '#D97706',
    polylineIda: encodePolylineMock([
      [-16.5262, -68.0772],
      [-16.5270, -68.0905],
      [-16.5180, -68.1050],
      [-16.5100, -68.1180],
      [-16.5034, -68.1305],
      [-16.4996, -68.1344],
      [-16.4952, -68.1370]
    ]),
    polylineVuelta: undefined,
    distanciaKm: 10.5,
    duracionMin: 30,
    intervaloMin: 4,
    estado: 'mantenimiento',
    numeroParadas: 5,
    paradasJson: JSON.stringify([
      { nombre: 'Iglesia San Miguel', orden: 1, latitud: -16.5262, longitud: -68.0772 },
      { nombre: 'Plaza Humboldt', orden: 2, latitud: -16.5270, longitud: -68.0905 },
      { nombre: 'Kantutani Entrada', orden: 3, latitud: -16.5100, longitud: -68.1180 },
      { nombre: 'Plaza del Estudiante', orden: 4, latitud: -16.5034, longitud: -68.1305 },
      { nombre: 'Plaza Pérez Velasco', orden: 5, latitud: -16.4952, longitud: -68.1370 }
    ]),
    modificadoPor: 'admin@comollego.org',
    comentario: 'Creación de ruta inicial express por la autopista Kantutani',
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: '2026-05-20T00:00:00Z',
    active: true
  }
];

// ============================================================
// 7. LUGARES MOCK (catálogo independiente)
// ============================================================
export const LUGARES_MOCK: Lugar[] = [
  // ============================================================
  // LA PAZ - ZONA CENTRO
  // ============================================================
  {
    id: 1,
    nombre: 'Plaza del Estudiante',
    ciudad: 'La Paz',
    latitud: -16.5034,
    longitud: -68.1305,
    descripcion: 'Parada principal en El Prado, cerca de la Universidad Mayor de San Andrés'
  },
  {
    id: 2,
    nombre: 'Plaza Pérez Velasco',
    ciudad: 'La Paz',
    latitud: -16.4952,
    longitud: -68.1370,
    descripcion: 'Terminal de trufis y minibuses hacia El Alto y Zona Sur'
  },
  {
    id: 3,
    nombre: 'El Prado (Monumento Colón)',
    ciudad: 'La Paz',
    latitud: -16.4996,
    longitud: -68.1344,
    descripcion: 'Corazón de la ciudad, conecta con todas las líneas de transporte'
  },
  {
    id: 4,
    nombre: 'Plaza San Pedro',
    ciudad: 'La Paz',
    latitud: -16.4988,
    longitud: -68.1396,
    descripcion: 'Cerca del mercado y la estación de teleférico'
  },
  {
    id: 5,
    nombre: 'Plaza Garita de Lima',
    ciudad: 'La Paz',
    latitud: -16.4950,
    longitud: -68.1444,
    descripcion: 'Punto de encuentro para micros hacia Miraflores'
  },

  // ============================================================
  // LA PAZ - ZONA SUR
  // ============================================================
  {
    id: 6,
    nombre: 'Paradero Chasquipampa',
    ciudad: 'La Paz',
    latitud: -16.5360,
    longitud: -68.0676,
    descripcion: 'Inicio de la ruta 242, conecta con Obrajes y Calacoto'
  },
  {
    id: 7,
    nombre: 'Calle 21 Calacoto',
    ciudad: 'La Paz',
    latitud: -16.5242,
    longitud: -68.0820,
    descripcion: 'Zona residencial, paso de minibuses y trufis'
  },
  {
    id: 8,
    nombre: 'Obrajes Calle 8',
    ciudad: 'La Paz',
    latitud: -16.5180,
    longitud: -68.1130,
    descripcion: 'Parada principal en Obrajes, cerca de colegios y universidades'
  },
  {
    id: 9,
    nombre: 'Iglesia San Miguel',
    ciudad: 'La Paz',
    latitud: -16.5262,
    longitud: -68.0772,
    descripcion: 'Punto de referencia en San Miguel, zona residencial de alto nivel'
  },
  {
    id: 10,
    nombre: 'Plaza Humboldt',
    ciudad: 'La Paz',
    latitud: -16.5270,
    longitud: -68.0905,
    descripcion: 'Parque principal de San Miguel, paso de trufis'
  },

  // ============================================================
  // LA PAZ - MIRAFLORES
  // ============================================================
  {
    id: 11,
    nombre: 'Plaza Villarroel',
    ciudad: 'La Paz',
    latitud: -16.4891,
    longitud: -68.1215,
    descripcion: 'Ingreso a Miraflores, cerca del Hospital de Clínicas'
  },
  {
    id: 12,
    nombre: 'Hospital de Clínicas',
    ciudad: 'La Paz',
    latitud: -16.4962,
    longitud: -68.1235,
    descripcion: 'Parada frente al hospital, paso de micros y minibuses'
  },
  {
    id: 13,
    nombre: 'Monumento Busch',
    ciudad: 'La Paz',
    latitud: -16.4980,
    longitud: -68.1305,
    descripcion: 'Rotonda en El Prado, punto de conexión con Miraflores'
  },
  {
    id: 14,
    nombre: 'Cementerio General',
    ciudad: 'La Paz',
    latitud: -16.4940,
    longitud: -68.1500,
    descripcion: 'Terminal de micros hacia el centro y El Alto'
  },

  // ============================================================
  // LA PAZ - TELEFÉRICO
  // ============================================================
  {
    id: 15,
    nombre: 'Estación Central (Taypi Uta)',
    ciudad: 'La Paz',
    latitud: -16.4930,
    longitud: -68.1401,
    descripcion: 'Estación principal del teleférico, conexión con todas las líneas'
  },
  {
    id: 16,
    nombre: 'Estación Cementerio (Ajayuni)',
    ciudad: 'La Paz',
    latitud: -16.4945,
    longitud: -68.1495,
    descripcion: 'Estación del teleférico cerca del Cementerio General'
  },
  {
    id: 17,
    nombre: 'Estación 16 de Julio (Jach\'a Qhathu)',
    ciudad: 'El Alto',
    latitud: -16.4925,
    longitud: -68.1632,
    descripcion: 'Estación del teleférico en El Alto, conexión con la feria'
  },
  {
    id: 18,
    nombre: 'Estación Irpavi',
    ciudad: 'La Paz',
    latitud: -16.5230,
    longitud: -68.0840,
    descripcion: 'Estación del teleférico en la Zona Sur'
  },
  {
    id: 19,
    nombre: 'Estación Libertador',
    ciudad: 'La Paz',
    latitud: -16.5280,
    longitud: -68.0980,
    descripcion: 'Estación del teleférico en la Zona Sur'
  },
  {
    id: 20,
    nombre: 'Estación Delicias',
    ciudad: 'La Paz',
    latitud: -16.5320,
    longitud: -68.1120,
    descripcion: 'Estación del teleférico en la Zona Sur'
  },

  // ============================================================
  // LA PAZ - KANTUTANI / AUTOPISTA
  // ============================================================
  {
    id: 21,
    nombre: 'Kantutani Entrada',
    ciudad: 'La Paz',
    latitud: -16.5100,
    longitud: -68.1180,
    descripcion: 'Ingreso a la autopista Kantutani, paso de trufis express'
  },

  // ============================================================
  // EL ALTO
  // ============================================================
  {
    id: 22,
    nombre: 'Terminal de Buses El Alto',
    ciudad: 'El Alto',
    latitud: -16.4850,
    longitud: -68.1700,
    descripcion: 'Terminal interprovincial, conexión con La Paz y otras ciudades'
  },
  {
    id: 23,
    nombre: 'Plaza de la Cruz El Alto',
    ciudad: 'El Alto',
    latitud: -16.4880,
    longitud: -68.1650,
    descripcion: 'Punto de referencia en El Alto, paso de minibuses'
  },

  // ============================================================
  // COCHABAMBA (para futuro)
  // ============================================================
  {
    id: 24,
    nombre: 'Plaza 14 de Septiembre',
    ciudad: 'Cochabamba',
    latitud: -17.3935,
    longitud: -66.1570,
    descripcion: 'Plaza principal de Cochabamba'
  },
  {
    id: 25,
    nombre: 'Av. America',
    ciudad: 'Cochabamba',
    latitud: -17.3890,
    longitud: -66.1620,
    descripcion: 'Avenida principal de Cochabamba'
  },

  // ============================================================
  // SANTA CRUZ
  // ============================================================
  {
    id: 26,
    nombre: 'Plaza 24 de Septiembre',
    ciudad: 'Santa Cruz',
    latitud: -17.7835,
    longitud: -63.1820,
    descripcion: 'Plaza principal de Santa Cruz'
  },
  {
    id: 27,
    nombre: 'Av. Monseñor Rivero',
    ciudad: 'Santa Cruz',
    latitud: -17.7800,
    longitud: -63.1900,
    descripcion: 'Avenida principal de Santa Cruz'
  },

  // ============================================================
  // SUCRE
  // ============================================================
  {
    id: 28,
    nombre: 'Plaza 25 de Mayo',
    ciudad: 'Sucre',
    latitud: -19.0474,
    longitud: -65.2590,
    descripcion: 'Plaza principal de Sucre, corazón de la ciudad'
  },
  {
    id: 29,
    nombre: 'Calle Bolívar',
    ciudad: 'Sucre',
    latitud: -19.0450,
    longitud: -65.2550,
    descripcion: 'Calle principal de Sucre'
  },

  // ============================================================
  // POTOSÍ
  // ============================================================
  {
    id: 30,
    nombre: 'Plaza 10 de Noviembre',
    ciudad: 'Potosí',
    latitud: -19.5897,
    longitud: -65.7534,
    descripcion: 'Plaza principal de Potosí'
  },
  {
    id: 31,
    nombre: 'Av. Potosí',
    ciudad: 'Potosí',
    latitud: -19.5870,
    longitud: -65.7550,
    descripcion: 'Avenida principal de Potosí'
  },

  // ============================================================
  // ORURO
  // ============================================================
  {
    id: 32,
    nombre: 'Plaza 10 de Febrero',
    ciudad: 'Oruro',
    latitud: -17.9685,
    longitud: -67.1140,
    descripcion: 'Plaza principal de Oruro'
  },
  {
    id: 33,
    nombre: 'Av. 6 de Octubre',
    ciudad: 'Oruro',
    latitud: -17.9660,
    longitud: -67.1120,
    descripcion: 'Avenida principal de Oruro'
  }
];