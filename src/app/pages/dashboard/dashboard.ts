import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { SesionClase, ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

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

  modulos: ActividadEmparejamiento[] = [];
  todasLasSesiones: SesionClase[] = [];
  filtroNombre = '';
  pageSize: number = 5;
  currentPage: number = 1;

  get sesionesActivas(): SesionClase[] {
    return this.todasLasSesiones.filter(c => c.estado === 'en_curso');
  }

  get historialClases(): SesionClase[] {
    return this.todasLasSesiones.filter(c => c.estado === 'finalizada');
  }

  get historialFiltrado(): SesionClase[] {
    const q = this.filtroNombre.trim().toLowerCase();
    if (!q) return this.historialClases;
    return this.historialClases.filter(c =>
      c.nombreCurso.toLowerCase().includes(q)
    );
  }

  get historialPaginado(): SesionClase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.historialFiltrado.slice(start, start + this.pageSize);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historialFiltrado.length / this.pageSize) || 1;
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) this.currentPage = p;
  }

  cambiarTamanoPagina(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  ngOnInit(): void {
    this.cargarModulos();
    this.cargarSesiones();
  }

  cargarModulos() {
    this.apiService.obtenerProblemas().subscribe({
      next: (datos) => this.modulos = datos,
      error: (err) => console.error('Error al cargar módulos', err)
    });
  }

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
