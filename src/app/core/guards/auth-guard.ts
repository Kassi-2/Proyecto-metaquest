import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
// Si el usuario tiene token, se le permite pasar, de lo contrario se muestra una alerta y
// se redirige al login
  if (authService.estaAutenticado()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'Debes iniciar sesión para acceder al panel de administración',
      confirmButtonColor: '#3085d6'
    });
    router.navigate(['/login']);
    return false;
  }
};