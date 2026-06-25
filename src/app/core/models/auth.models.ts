// ============================================================
// 🔥 REQUEST: Lo que envías al backend (datos decodificados)
// ============================================================
export interface GoogleLoginRequest {
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
}

// ============================================================
// RESPONSE: Lo que devuelve el backend
// ============================================================
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl?: string;
  role: 'USER' | 'ADMIN';
  puntosTotales?: number;
  estrellas?: number;
  nivel?: string;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  messages: string[];
  data: T | null;
  timestamp: string;
  path: string | null;
}