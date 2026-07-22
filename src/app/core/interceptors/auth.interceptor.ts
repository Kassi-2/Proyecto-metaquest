import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth';

/**
 * Interceptor HTTP funcional que automatiza la inyección de credenciales de seguridad.
 * Intercepta todas las peticiones HTTP salientes de la aplicación y, si el usuario 
 * tiene una sesión activa, adjunta el token JWT en las cabeceras de autorización.
 * Si no hay un token disponible, permite que la petición continúe su flujo original.
 * 
 * @param req - La petición HTTP original en curso.
 * @param next - El siguiente manejador en la cadena de interceptores HTTP.
 * @returns Un flujo observable del evento HTTP, ya sea con la petición modificada o la original.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken(); 

  // Si existe el token, se clona la petición original (ya que son inmutables) 
  // y se inyecta la cabecera 'Authorization' con el esquema Bearer.
  if (token) {
    const peticionClonada = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(peticionClonada);
  }

  // Si no hay token, la petición sigue su ruta normal sin modificaciones.
  return next(req);
};