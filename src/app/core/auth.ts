import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Servicio encargado de gestionar la autenticación, registro y manejo de tokens de sesión.
 * Actúa como puente principal entre la aplicación Angular y los endpoints de seguridad del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
        
  /**
   * Envía las credenciales del usuario al backend para iniciar sesión.
   * Si la autenticación es exitosa, extrae y almacena el Access Token y el Refresh Token en el localStorage.
   * 
   * @param credenciales - Objeto que contiene el email y la contraseña del usuario.
   * @returns Un Observable con la respuesta del servidor.
   */
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

  /**
   * Registra a un nuevo profesor en el sistema.
   * 
   * @param datos - Objeto con la información requerida para el registro (nombre, email, password, etc.).
   * @returns Un Observable con el resultado de la creación del usuario, incluyendo su ID.
   */
  registrarProfesor(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos);
  }

  /**
   * Almacena el token de acceso principal (Access Token) en el almacenamiento local del navegador.
   * 
   * @param token - Cadena de texto que representa el JWT.
   */
  guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Recupera el token de acceso principal desde el almacenamiento local.
   * 
   * @returns El JWT como cadena de texto, o nulo si no existe.
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Recupera el token de refresco (Refresh Token) desde el almacenamiento local.
   * Este token tiene un tiempo de vida mayor y se usa para solicitar un nuevo Access Token.
   * 
   * @returns El JWT de refresco, o nulo si no existe.
   */
  obtenerRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Elimina todos los tokens de autenticación del almacenamiento local,
   * cerrando efectivamente la sesión del usuario en el cliente.
   */
  cerrarSesion(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica de manera rápida si el usuario tiene una sesión activa comprobando 
   * la existencia del token y descartando falsos positivos (como strings 'null').
   * 
   * @returns `true` si hay un token de acceso potencialmente válido guardado, `false` de lo contrario.
   */
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    return !!token && token !== 'null' && token !== 'undefined';
  }

  /**
   * Realiza una petición protegida al endpoint `/auth/me` para obtener los datos 
   * del perfil del usuario actualmente autenticado.
   * 
   * @returns Un Observable con la información del usuario (nombre, email, roles, etc.).
   */
  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  /**
   * Solicita al backend la renovación del Access Token utilizando el Refresh Token actual.
   * Es consumido por el interceptor cuando una petición falla por token expirado (JwtRefreshGuard).
   * 
   * @returns Un Observable con los nuevos tokens actualizados.
   */
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