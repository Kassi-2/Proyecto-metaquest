import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api';
import { ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

/**
 * Componente encargado de la creación y edición de las Actividades de Emparejamiento (Módulos).
 * Utiliza Formularios Reactivos para garantizar la validación e integridad de los datos
 * antes de enviarlos al backend, asegurando que la aplicación VR reciba estructuras correctas.
 */
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

  /** Formulario reactivo principal que agrupa toda la información del módulo y sus pares. */
  editorForm!: FormGroup;
  
  /** Identificador del módulo. Es `null` si se está creando uno nuevo, o un `string` si se está editando. */
  moduloId: string | null = null;
  
  /** Bandera que determina el contexto de la vista: `true` para actualizar, `false` para crear. */
  esModoEdicion = false;

  /**
   * Ciclo de vida: Inicializa el componente.
   * Determina si la ruta contiene un ID para activar el modo edición, 
   * inicializa el formulario vacío y, dependiendo del modo, carga los datos existentes o agrega un par inicial.
   */
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

  /**
   * Construye la estructura base del formulario reactivo aplicando reglas de validación.
   * Requiere un título (mínimo 4 caracteres), asignatura, descripción y prepara un arreglo dinámico para los pares.
   */
  inicializarFormulario() {
    this.editorForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(4)]],
      asignatura: ['', Validators.required],
      descripcion: ['', Validators.required],
      pares: this.fb.array([])
    });
  }

  /**
   * Getter de conveniencia para acceder al FormArray de los pares de conceptos.
   * @returns El control 'pares' casteado como un `FormArray`.
   */
  get paresFormArray(): FormArray {
    return this.editorForm.get('pares') as FormArray;
  }

  /**
   * Crea un nuevo grupo de controles (FormGroup) para un par de concepto/definición y lo añade al formulario dinámico.
   * 
   * @param concepto - Valor inicial del concepto (por defecto vacío).
   * @param definicion - Valor inicial de la definición (por defecto vacío).
   * @param descripcion - Valor inicial de la descripción adicional (por defecto vacío).
   */
  agregarPar(concepto = '', definicion = '', descripcion = '') {
    const parFormGroup = this.fb.group({
      concepto: [concepto, Validators.required],
      definicion: [definicion, Validators.required],
      descripcion: [descripcion]
    });
    this.paresFormArray.push(parFormGroup);
  }

  /**
   * Elimina un par de conceptos del formulario reactivo según su índice.
   * Incluye una regla de negocio que impide dejar la actividad sin al menos un par, mostrando una alerta.
   * 
   * @param index - Posición del par en el arreglo que se desea eliminar.
   */
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

  /**
   * En modo edición, solicita los datos del módulo al backend y rellena los campos del formulario.
   * Itera sobre los pares recibidos para agregarlos dinámicamente al FormArray.
   * 
   * @param id - Identificador único del módulo a cargar.
   */
  cargarDatosModulo(id: string) {
    this.apiService.obtenerModuloPorId(id).subscribe(modulo => {
      this.editorForm.patchValue({
        titulo: modulo.titulo,
        asignatura: modulo.asignatura,
        descripcion: modulo.descripcion
      });
      modulo.pares.forEach(par => {
        this.agregarPar(par.concepto, par.definicion, par.descripcion);
      });
    });
  }

  /**
   * Valida y procesa el envío del formulario.
   * Si es válido, extrae los datos y decide si debe realizar una petición POST (Crear) o PUT/PATCH (Actualizar).
   * Emplea un Toast de SweetAlert2 para notificar el éxito o muestra una alerta en caso de error de conexión.
   */
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
    
    // Configuración del Toast (notificación no intrusiva)
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