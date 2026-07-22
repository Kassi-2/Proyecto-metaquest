import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import Swal from 'sweetalert2';

/**
 * Interfaz que define la estructura de la respuesta del servidor 
 * al crear un usuario nuevo exitosamente.
 */
interface ResponseCreateUser{
  data : {id : number}
}

/**
 * Componente responsable de la interfaz de autenticación.
 * Gestiona tanto el inicio de sesión de los usuarios existentes como el registro de nuevas cuentas,
 * sirviendo como la barrera de seguridad inicial para acceder al panel de administración.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Bandera que alterna la vista del componente entre 'Iniciar Sesión' (false) y 'Registro' (true). */
  esModoRegistro = false;

  /** 
   * Formulario reactivo que agrupa los campos de autenticación.
   * Incluye validaciones síncronas para asegurar que se ingrese un email válido y 
   * una contraseña con la longitud mínima requerida por el backend.
   */
  authForm: FormGroup = this.fb.group({
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Alterna el estado del componente entre el modo de registro y el modo de inicio de sesión.
   * Al cambiar de modo, limpia todos los campos del formulario para evitar que 
   * datos residuales (como la contraseña) queden expuestos.
   */
  toggleModo() {
    this.esModoRegistro = !this.esModoRegistro;
    this.authForm.reset();
  }

  /**
   * Procesa el envío del formulario.
   * Si el formulario no cumple con las validaciones, aborta la ejecución silenciosamente.
   * Dependiendo del valor de `esModoRegistro`, orquesta la llamada al servicio correspondiente 
   * para registrar o autenticar al usuario. 
   * Incorpora alertas visuales para brindar retroalimentación inmediata sobre errores o accesos denegados.
   */
  onSubmit() {
    if (this.authForm.invalid) return;

    if (this.esModoRegistro) {
      this.authService.registrarProfesor(this.authForm.value).subscribe({
        next: (res : ResponseCreateUser) => {
          console.log('Registro exitoso', res.data.id);
          this.esModoRegistro = false;
          this.authForm.reset();
        },
        error: (err) => {
          console.error('Error en el registro', err);
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ocurrió un error al intentar registrar el usuario.',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } else {
      const { email, password } = this.authForm.value;
      this.authService.iniciarSesion({ email, password }).subscribe({
        next: (res) => {
          console.log('Login exitoso', res);
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          console.error('Error al iniciar sesión', err);
          Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Credenciales incorrectas. Por favor, intenta nuevamente.',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }
}