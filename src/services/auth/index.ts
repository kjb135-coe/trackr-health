// Use mock auth service for now - swap to './authService' when Firebase is configured
export { authService, useGoogleAuth } from './mockAuthService';
export type { AuthUser } from './mockAuthService';
