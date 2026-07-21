import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken(); 

  // Si existe el token, se copia la petición y se inyecta la cabecera
  // Si no hay token, la petición sigue su ruta normal
  if (token) {
    const peticionClonada = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)    });
    return next(peticionClonada);
  }

  return next(req);
};