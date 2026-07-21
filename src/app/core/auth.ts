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

  iniciarSesion(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((respuesta: any) => {
        const token = respuesta?.token ? respuesta.token : 'token-simulado-111';
        this.guardarToken(token);
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

  cerrarSesion(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Retorna true si el token existe en localStorage
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }
}