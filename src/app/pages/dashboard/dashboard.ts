import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/api';
import { SesionClase, ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  modulos: ActividadEmparejamiento[] = [];

  codigoSesionActiva: string | null = null;

  // ARREGLO DE CLASES PROVISORIO - CAMBIAR
  historialClases: SesionClase[] = [
  { id: 'c1', nombreCurso: 'Anatomía Humana - Sec 1', fecha: '28 de Mayo, 2026', codigoPin: 'A9X2P4', estado: 'finalizada', actividadesAsignadasIds: ['1'], mostrarPistas: true, penalizacionPorFallo: 3, tiempoLimiteMinutos: 5 },
  { id: 'c2', nombreCurso: 'Introducción a la Informática', fecha: '30 de Mayo, 2026', codigoPin: 'M7B4K9', estado: 'en_curso', actividadesAsignadasIds: ['2'], mostrarPistas: false, penalizacionPorFallo: 5, tiempoLimiteMinutos: 10 }
];

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos() {
    this.apiService.obtenerProblemas().subscribe({
      next: (datos) => this.modulos = datos,
      error: (err) => console.error('Error al cargar módulos', err)
    });
  }

  iniciarSesionClase() {
  const nuevoId = 'c' + (this.historialClases.length + 1);
  const nuevoPin = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const nuevaClase: SesionClase = {
    id: nuevoId,
    nombreCurso: 'Nueva Clase Configurada',
    fecha: 'Hoy',
    codigoPin: nuevoPin,
    estado: 'en_curso',
    actividadesAsignadasIds: [],
    mostrarPistas: true,
    penalizacionPorFallo: 0,
    tiempoLimiteMinutos: 0
  };

  this.historialClases.push(nuevaClase);
  this.router.navigate(['/clase-config', nuevoId]);
}

  terminarSesionClase() {
    this.codigoSesionActiva = null;
    console.log('La clase ha finalizado.');
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }

  eliminarModulo(modulo: ActividadEmparejamiento) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el módulo "${modulo.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar módulo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        this.modulos = this.modulos.filter(m => m.id !== modulo.id);

        Swal.fire(
          '¡Eliminado!',
          'El módulo ha sido eliminado.',
          'success'
        );
      }
    });
  }
}