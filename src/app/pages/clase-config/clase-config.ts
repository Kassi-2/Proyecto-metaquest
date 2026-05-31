import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { ActividadEmparejamiento, SesionClase } from '../../core/model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clase-config',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clase-config.html',
  styleUrls: ['./clase-config.css']
})
export class ClaseConfigComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  pestanaActiva: 'modulos' | 'parametros' | 'monitoreo' = 'modulos';
  claseId!: string;
  claseActual!: SesionClase;
  todosLosModulos: ActividadEmparejamiento[] = []; 

  //ARREGLO DE PRUEBA - CAMBIAR
alumnosConectados = [
  { 
    codigo: 'ALUM-01', 
    estado: 'en_curso', 
    pares: '3/10', 
    progreso: '30%', 
    fallos: 1, 
    tiempo: 45, 
    puntaje: 0 
  },
  { 
    codigo: 'ALUM-02', 
    estado: 'en_curso', 
    pares: '6/10', 
    progreso: '60%', 
    fallos: 4,
    tiempo: 125, 
    puntaje: 0 
  },
  { 
    codigo: 'ALUM-03', 
    estado: 'finalizado', 
    pares: '10/10', 
    progreso: '100%', 
    fallos: 0, 
    tiempo: 85, 
    puntaje: 100 
  }
];

  ngOnInit(): void {
    this.claseId = this.route.snapshot.paramMap.get('id') || '';
    this.obtenerDatosClase();
    this.obtenerTodosLosModulos();
  }

  obtenerDatosClase() {
    this.claseActual = {
      id: this.claseId,
      nombreCurso: 'Nombre de Asignatura', 
      fecha: '30 de Mayo, 2026',
      codigoPin: 'X8F2P1',
      estado: 'en_curso',
      actividadesAsignadasIds: ['1'],
      mostrarPistas: true,
      penalizacionPorFallo: 5,
      tiempoLimiteMinutos: 5 
    };
  }

  obtenerTodosLosModulos() {
    this.apiService.obtenerProblemas().subscribe((datos: any) => {
      this.todosLosModulos = datos;
    });
  }

  cambiarPestana(pestana: 'modulos' | 'parametros' | 'monitoreo') {
    this.pestanaActiva = pestana;
  }

  toggleModulo(id: string) {
    const index = this.claseActual.actividadesAsignadasIds.indexOf(id);
    if (index > -1) {
      this.claseActual.actividadesAsignadasIds.splice(index, 1);
    } else {
      this.claseActual.actividadesAsignadasIds.push(id);
    }
  }

  guardarConfiguracion() {
    console.log('Guardando configuración:', this.claseActual);
    
    Swal.fire({
      title: 'Configuración Guardada',
      text: 'Los parámetros han sido actualizados correctamente.',
      icon: 'success',
      confirmButtonColor: '#2e7d32',
      timer: 2500,
      timerProgressBar: true
    });
  }
}