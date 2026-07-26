import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../core/auth';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['iniciarSesion', 'registrarProfesor']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule], 
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    spyOn(console, 'error');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente e inicializar el formulario inválido', () => {
    expect(component).toBeTruthy();
    expect(component.authForm.valid).toBeFalse();
    expect(component.esModoRegistro).toBeFalse();
  });

  it('debería validar correctamente el formato del email y longitud del password', () => {
    const emailControl = component.authForm.get('email');
    const passwordControl = component.authForm.get('password');

    emailControl?.setValue('correo-sin-formato');
    passwordControl?.setValue('12345'); 
    expect(emailControl?.valid).toBeFalse();
    expect(passwordControl?.valid).toBeFalse();

    emailControl?.setValue('profesor@uchile.cl');
    passwordControl?.setValue('segura123');
    expect(emailControl?.valid).toBeTrue();
    expect(passwordControl?.valid).toBeTrue();
    expect(component.authForm.valid).toBeTrue();
  });

  it('debería alternar entre login/registro y resetear el formulario (toggleModo)', () => {
    component.authForm.patchValue({ email: 'test@test.com', password: '123' });
    component.toggleModo();
    expect(component.esModoRegistro).toBeTrue();
    expect(component.authForm.get('email')?.value).toBeNull();
  });

  it('no debería llamar a la API si el formulario es inválido', () => {
    component.onSubmit();
    expect(mockAuthService.iniciarSesion).not.toHaveBeenCalled();
    expect(mockAuthService.registrarProfesor).not.toHaveBeenCalled();
  });

  it('debería iniciar sesión y navegar al dashboard si las credenciales son correctas', () => {
    component.authForm.patchValue({ email: 'test@test.com', password: 'password123' });
    mockAuthService.iniciarSesion.and.returnValue(of({ token: 'fake-token' } as any));

    component.onSubmit();

    expect(mockAuthService.iniciarSesion).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debería mostrar un error (SweetAlert) si el login falla', () => {
    component.authForm.patchValue({ email: 'test@test.com', password: 'password123' });
    mockAuthService.iniciarSesion.and.returnValue(throwError(() => new Error('Credenciales inválidas')));

    component.onSubmit();

    expect(mockAuthService.iniciarSesion).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error' }));
  });

  it('debería registrar al usuario, cambiar a modo login y limpiar formulario', () => {
    component.esModoRegistro = true;
    component.authForm.patchValue({ nombre: 'Juan', email: 'juan@test.com', password: 'password123' });
    
    const mockRespuesta = { data: { id: 1 } };
    mockAuthService.registrarProfesor.and.returnValue(of(mockRespuesta));

    component.onSubmit();

    expect(mockAuthService.registrarProfesor).toHaveBeenCalledWith({
      nombre: 'Juan',
      email: 'juan@test.com',
      password: 'password123'
    });
    expect(component.esModoRegistro).toBeFalse();
    expect(component.authForm.get('email')?.value).toBeNull();
  });

  it('debería mostrar un error (SweetAlert) si el registro falla', () => {
    component.esModoRegistro = true;
    component.authForm.patchValue({ email: 'test@test.com', password: 'password123' });
    mockAuthService.registrarProfesor.and.returnValue(throwError(() => new Error('Error de base de datos')));

    component.onSubmit();

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Oops...' }));
  });
});