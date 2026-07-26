import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor'; 
import { AuthService } from '../auth'; 

describe('authInterceptor', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRequest: HttpRequest<unknown>;
  let mockNext: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    // ARRANGE
    mockAuthService = jasmine.createSpyObj('AuthService', ['obtenerToken']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    // Simular una petición HTTP genérica saliendo hacia el backend
    mockRequest = new HttpRequest('GET', '/api/resultados');
    
    // Simular el siguiente eslabón en la cadena HTTP. 
    mockNext = jasmine.createSpy('next').and.returnValue(of({} as HttpEvent<unknown>));
  });

  it('debería clonar la petición e inyectar el token Bearer si el usuario está autenticado', () => {
    // ARRANGE: Simular token válido en sesión
    const tokenSimulado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    mockAuthService.obtenerToken.and.returnValue(tokenSimulado);

    // ACT
    TestBed.runInInjectionContext(() => authInterceptor(mockRequest, mockNext));

    // ASSERT
    const peticionModificada = mockNext.calls.mostRecent().args[0] as HttpRequest<unknown>;

    // Verificar que la petición original no se fue vacía, sino que lleva la cabecera
    expect(peticionModificada.headers.has('Authorization')).toBeTrue();
    expect(peticionModificada.headers.get('Authorization')).toBe(`Bearer ${tokenSimulado}`);
  });

  it('debería dejar la petición intacta si NO existe un token guardado', () => {
    // ARRANGE
    mockAuthService.obtenerToken.and.returnValue(null);

    // ACT
    TestBed.runInInjectionContext(() => authInterceptor(mockRequest, mockNext));

    // ASSERT
    const peticionRecibida = mockNext.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(mockNext).toHaveBeenCalledWith(mockRequest);
    expect(peticionRecibida.headers.has('Authorization')).toBeFalse();
  });
});