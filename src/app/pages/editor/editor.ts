import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api';
import { ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css']
})
export class EditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  editorForm!: FormGroup;
  moduloId: string | null = null;
  esModoEdicion = false;

  ngOnInit(): void {
    this.moduloId = this.route.snapshot.paramMap.get('id');
    this.esModoEdicion = !!this.moduloId;

    this.inicializarFormulario();

    if (this.esModoEdicion && this.moduloId) {
      this.cargarDatosModulo(this.moduloId);
    } else {
      this.agregarPar();
    }
  }

  inicializarFormulario() {
    this.editorForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(4)]],
      asignatura: ['', Validators.required],
      descripcion: ['', Validators.required],
      pares: this.fb.array([])
    });
  }

  get paresFormArray(): FormArray {
    return this.editorForm.get('pares') as FormArray;
  }
  agregarPar(concepto = '', definicion = '') {
    const parFormGroup = this.fb.group({
      concepto: [concepto, Validators.required],
      definicion: [definicion, Validators.required]
    });
    this.paresFormArray.push(parFormGroup);
  }

  eliminarPar(index: number) {
    if (this.paresFormArray.length > 1) {
      this.paresFormArray.removeAt(index);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'Debes incluir al menos un par de conceptos para que el sistema funcione.',
        confirmButtonColor: '#0d6efd'
      });
    }
  }

  cargarDatosModulo(id: string) {
    this.apiService.obtenerModuloPorId(id).subscribe(modulo => {
      this.editorForm.patchValue({
        titulo: modulo.titulo,
        asignatura: modulo.asignatura,
        descripcion: modulo.descripcion
      });
      modulo.pares.forEach(par => {
        this.agregarPar(par.concepto, par.definicion);
      });
    });
  }

  guardarModulo() {
    if (this.editorForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Revisa que todos los campos estén llenos antes de guardar.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    const datosModulo: ActividadEmparejamiento = this.editorForm.value;
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });

    if (this.esModoEdicion && this.moduloId) {
      this.apiService.actualizarModulo(this.moduloId, datosModulo).subscribe({
        next: () => {
          Toast.fire({ icon: 'success', title: 'Módulo actualizado con éxito' });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error del servidor:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo guardar el módulo. Error en el servidor.',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
    } else {
      this.apiService.crearModulo(datosModulo).subscribe({
        next: () => {
          Toast.fire({ icon: 'success', title: 'Módulo creado correctamente' });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error del servidor:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo crear el módulo. Error en el servidor.',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
    }
  }
}