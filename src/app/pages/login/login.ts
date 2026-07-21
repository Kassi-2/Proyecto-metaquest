import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

interface ResponseCreateUser{
  data : {id : number}
}

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

  esModoRegistro = false;

  authForm: FormGroup = this.fb.group({
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleModo() {
    this.esModoRegistro = !this.esModoRegistro;
    this.authForm.reset();
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    if (this.esModoRegistro) {
      this.authService.registrarProfesor(this.authForm.value).subscribe({
        next: (res : ResponseCreateUser) => {
          console.log('Registro exitoso', res.data.id);
          this.esModoRegistro = false;
          this.authForm.reset();
        },
        error: (err) => console.error('Error en el registro', err)
      });
    } else {
      const { email, password } = this.authForm.value;
      this.authService.iniciarSesion({ email, password }).subscribe({
        next: (res) => {
          console.log('Login exitoso', res);
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => console.error('Error al iniciar sesión', err)
      });
    }
  }
}
