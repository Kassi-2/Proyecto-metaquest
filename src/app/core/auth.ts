import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
        
  // Se extraen los tokens desde data del JSON
  iniciarSesion(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.data) {
          const accessToken = respuesta.data.accessToken;
          const refreshToken = respuesta.data.refreshToken;

          if (accessToken) {
            this.guardarToken(accessToken);
          }
          if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
          }
        }
      })
    );
  }

  registrarProfesor(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos);
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  obtenerRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Retorna true si el token existe en localStorage
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    return !!token && token !== 'null' && token !== 'undefined';
  }

  // Obtiene el endpoint /auth/me
  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  // Endpoint para el JwtRefreshGuard
  renovarToken(): Observable<any> {
    const refreshToken = this.obtenerRefreshToken();
    return this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.data) {
          if (respuesta.data.accessToken) {
            this.guardarToken(respuesta.data.accessToken);
          }
          if (respuesta.data.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, respuesta.data.refreshToken);
          }
        }
      })
    );
  }
}