import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../auth';
import Swal from 'sweetalert2';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let dummyRoute: ActivatedRouteSnapshot;
  let dummyState: RouterStateSnapshot;

  beforeEach(() => {
    // ARRANGE
    mockAuthService = jasmine.createSpyObj('AuthService', ['estaAutenticado']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    dummyRoute = {} as ActivatedRouteSnapshot;
    dummyState = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
  });


  it('debería permitir el acceso (retornar true) si el usuario tiene una sesión válida', () => {
    // ARRANGE
    mockAuthService.estaAutenticado.and.returnValue(true);

    // ACT: Ejecutar el guard funcional dentro de inyección de Angular
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    // ASSERT
    expect(result).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // No debe redirigir
    expect(Swal.fire).not.toHaveBeenCalled(); // No debe mostrar alerta
  });

  it('debería denegar el acceso, mostrar alerta y redirigir al login si el usuario NO está autenticado', () => {
    // ARRANGE
    mockAuthService.estaAutenticado.and.returnValue(false);

    // ACT
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    // ASSERT
    expect(result).toBeFalse();
    
    // Verificar que se intente redirigir a la pantalla correcta
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    
    // Verificar que se levante la alerta de bloqueo
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'warning',
      title: 'Acceso Denegado'
    }));
  });
});