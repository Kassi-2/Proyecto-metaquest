import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth';
import Swal from 'sweetalert2';

/**
 * Guard funcional de Angular encargado de proteger las rutas restringidas del sistema.
 * Implementa las firmas CanActivateFn y CanActivateChildFn para interceptar 
 * la navegación hacia rutas principales y sus rutas hijas, asegurando que 
 * solo los usuarios con una sesión válida puedan acceder.
 * 
 * @param route - Información sobre la ruta a la que se intenta acceder.
 * @param state - El estado actual del router (URL y parámetros).
 * @returns `true` si el usuario está autenticado, permitiendo que la navegación continúe. 
 *          Si no está autenticado, retorna false, detiene la navegación, 
 *          muestra una alerta visual con SweetAlert2 y redirige a la vista de login.
 */
export const authGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario tiene token, se le permite pasar; de lo contrario, se muestra una alerta y
  // se redirige al login.
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