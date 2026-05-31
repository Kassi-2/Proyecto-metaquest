import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { RendimientoAlumno, SesionClase } from '../../core/model';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {
  // ARREGLO PARA SECCIÓN DE RENDIMIENTO GLOBAL - CAMBIAR 
  registros: RendimientoAlumno[] = [
    { idSesion: 'c1', nombreClase: 'Anatomía Humana', codigoAlumno: 'ALUM-01', estado: 'finalizado', paresCompletados: 10, totalPares: 10, intentosFallidos: 2, tiempoSegundos: 145, puntajeFinal: 85 },
    { idSesion: 'c1', nombreClase: 'Anatomía Humana', codigoAlumno: 'ALUM-02', estado: 'finalizado', paresCompletados: 10, totalPares: 10, intentosFallidos: 0, tiempoSegundos: 90, puntajeFinal: 100 },
    { idSesion: 'c2', nombreClase: 'Intro a Informática', codigoAlumno: 'ALUM-03', estado: 'en_curso', paresCompletados: 4, totalPares: 8, intentosFallidos: 5, tiempoSegundos: 300, puntajeFinal: 40 }
  ];

  registrosFiltrados: RendimientoAlumno[] = [];
  clasesDisponibles: string[] = [];
  filtroClaseSeleccionada: string = 'Todas';

  ngOnInit(): void {
    this.registrosFiltrados = [...this.registros];
    
    this.clasesDisponibles = Array.from(new Set(this.registros.map(r => r.nombreClase)));
  }

  aplicarFiltro() {
    if (this.filtroClaseSeleccionada === 'Todas') {
      this.registrosFiltrados = [...this.registros];
    } else {
      this.registrosFiltrados = this.registros.filter(r => r.nombreClase === this.filtroClaseSeleccionada);
    }
  }

  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`;
  }
}