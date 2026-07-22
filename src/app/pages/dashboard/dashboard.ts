import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { SesionClase, ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

/**
 * Componente principal del panel de control (Dashboard).
 * Gestiona la visualización, filtrado y paginación del historial de clases, 
 * así como la administración del catálogo de módulos de emparejamiento.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  /** Catálogo completo de los módulos (actividades) disponibles en el sistema. */
  modulos: ActividadEmparejamiento[] = [];
  
  /** Lista global que almacena todas las sesiones (activas y finalizadas) provenientes del backend. */
  todasLasSesiones: SesionClase[] = [];
  
  /** Término de búsqueda ingresado por el usuario para filtrar el historial por nombre del curso. */
  filtroNombre = '';
  
  /** Cantidad de elementos a mostrar por página en las tablas del dashboard. */
  pageSize: number = 5;
  
  /** Índice de la página actual seleccionada en la vista de paginación. */
  currentPage: number = 1;

  /**
   * Obtiene dinámicamente las sesiones que actualmente se están ejecutando.
   * @returns Un arreglo de sesiones con estado 'en_curso'.
   */
  get sesionesActivas(): SesionClase[] {
    return this.todasLasSesiones.filter(c => c.estado === 'en_curso');
  }

  /**
   * Obtiene dinámicamente las sesiones que ya concluyeron.
   * @returns Un arreglo de sesiones con estado 'finalizada'.
   */
  get historialClases(): SesionClase[] {
    return this.todasLasSesiones.filter(c => c.estado === 'finalizada');
  }

  /**
   * Aplica el filtro de texto sobre el historial de clases finalizadas.
   * @returns Un arreglo de sesiones finalizadas que coinciden con el término de búsqueda.
   */
  get historialFiltrado(): SesionClase[] {
    const q = this.filtroNombre.trim().toLowerCase();
    if (!q) return this.historialClases;
    return this.historialClases.filter(c =>
      c.nombreCurso.toLowerCase().includes(q)
    );
  }

  /**
   * Calcula y retorna el subconjunto de datos del historial filtrado correspondiente 
   * a la página actual, basado en el tamaño de página (pageSize).
   * @returns Un arreglo paginado de sesiones.
   */
  get historialPaginado(): SesionClase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.historialFiltrado.slice(start, start + this.pageSize);
  }

  /**
   * Calcula el número total de páginas necesarias para mostrar todo el historial filtrado.
   * @returns El número total de páginas (mínimo 1).
   */
  get totalPaginas(): number {
    return Math.ceil(this.historialFiltrado.length / this.pageSize) || 1;
  }

  /**
   * Actualiza el índice de la página actual si el valor proporcionado está dentro de los límites.
   * @param p - Número de la nueva página a la que se desea navegar.
   */
  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) this.currentPage = p;
  }

  /**
   * Cambia la cantidad de elementos que se muestran por página y reinicia la vista a la página 1.
   * @param size - Nueva cantidad de elementos por página.
   */
  cambiarTamanoPagina(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  /**
   * Ciclo de vida: Al inicializar el componente, dispara las peticiones HTTP
   * para obtener tanto los módulos como las sesiones existentes.
   */
  ngOnInit(): void {
    this.cargarModulos();
    this.cargarSesiones();
  }

  /**
   * Solicita al backend el catálogo completo de problemas/módulos de emparejamiento.
   */
  cargarModulos() {
    this.apiService.obtenerProblemas().subscribe({
      next: (datos) => this.modulos = datos,
      error: (err) => console.error('Error al cargar módulos', err)
    });
  }

  /**
   * Obtiene el listado completo de sesiones desde el servidor.
   * Incluye un mecanismo de respaldo (fallback) que intenta obtener solo las sesiones activas
   * si la petición general falla.
   */
  cargarSesiones() {
    this.apiService.obtenerTodasLasSesiones().subscribe({
      next: (sesiones) => {
        this.todasLasSesiones = sesiones;
        this.cargarModulosDeSesiones();
      },
      error: () => {
        this.apiService.obtenerSesionesActivas().subscribe({
          next: (activas) => {
            this.todasLasSesiones = activas;
            this.cargarModulosDeSesiones();
          },
        });
      }
    });
  }

  /**
   * Método interno encargado de poblar los detalles (módulos asociados) de cada sesión.
   * Itera sobre las sesiones descargadas y realiza peticiones individuales al backend.
   */
  private cargarModulosDeSesiones() {
    for (const sesion of this.todasLasSesiones) {
      const id = sesion.sessionIdBackend;
      if (!id) continue;
      this.apiService.obtenerSesionPorId(id).subscribe({
        next: (datos) => {
          sesion.modulos = datos.modulos;
        },
      });
    }
  }

  /**
   * Solicita al backend la creación de una nueva sesión de clase en blanco.
   * Si es exitosa, redirige automáticamente al profesor a la vista de configuración de esa clase.
   */
  iniciarSesionClase() {
    this.apiService.crearSesion('Nueva Clase').subscribe({
      next: (nuevaClase) => {
        this.todasLasSesiones.unshift(nuevaClase);
        this.router.navigate(['/clase-config', nuevaClase.id]);
      },
      error: (err) => {
        console.error('Error al crear sesión', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear la clase.' });
      }
    });
  }

  /**
   * Confirma y ejecuta la eliminación de un módulo (actividad) tanto en la interfaz como en el backend.
   * 
   * @param modulo - El objeto del módulo que se desea eliminar.
   */
  eliminarModulo(modulo: ActividadEmparejamiento) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el módulo "${modulo.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8C3A2B',
      cancelButtonColor: '#6B6862',
      confirmButtonText: 'Sí, eliminar módulo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && modulo.id) {
        this.apiService.eliminarModuloBackend(modulo.id).subscribe({
          next: () => {
            this.modulos = this.modulos.filter(m => m.id !== modulo.id);
            Swal.fire('¡Eliminado!', 'El módulo ha sido eliminado.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar módulo', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el módulo.' });
          }
        });
      }
    });
  }

  /**
   * Confirma y solicita al backend el cierre definitivo de una sesión de clase activa.
   * Al finalizar, actualiza el estado local de la sesión a 'finalizada' para que los *getters* 
   * reactivos actualicen la tabla automáticamente.
   * 
   * @param sesion - Objeto de la sesión que se desea cerrar.
   */
  finalizarSesion(sesion: SesionClase) {
    if (!sesion.sessionIdBackend) return;
    Swal.fire({
      title: '¿Finalizar clase?',
      text: `Se cerrará la sesión "${sesion.nombreCurso}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8C3A2B',
      cancelButtonColor: '#6B6862',
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.cerrarSesion(sesion.sessionIdBackend!).subscribe({
          next: () => {
            this.todasLasSesiones = this.todasLasSesiones.map(c =>
              c.id === sesion.id ? { ...c, estado: 'finalizada' as const } : c
            );
            Swal.fire('¡Finalizada!', 'La clase ha sido cerrada.', 'success');
          },
          error: (err) => {
            console.error('Error al cerrar sesión', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cerrar la clase.' });
          }
        });
      }
    });
  }
}