import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('debería crearse correctamente el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debería retornar false en estaAutenticado() si no hay un token guardado', () => {
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('debería retornar true en estaAutenticado() si existe un token guardado', () => {
    localStorage.setItem('auth_token', 'un-token-falso-de-prueba');
    
    expect(service.estaAutenticado()).toBeTrue();
  });
});