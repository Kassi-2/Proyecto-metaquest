import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { WebSocketService } from '../../core/websocket.service';
import { ActividadEmparejamiento, SesionClase, AlumnoSesion } from '../../core/model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clase-config',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clase-config.html',
  styleUrls: ['./clase-config.css']
})
export class ClaseConfigComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private ws = inject(WebSocketService);

  pestanaActiva: 'modulos' | 'parametros' | 'monitoreo' = 'modulos';
  claseId!: string;
  claseActual!: SesionClase;
  todosLosModulos: ActividadEmparejamiento[] = [];
  modulosSeleccionados: ActividadEmparejamiento[] = [];
  rondaIniciada = false;
  alumnosConectados: AlumnoSesion[] = [];

  ngOnInit(): void {
    this.claseId = this.route.snapshot.paramMap.get('id') || '';
    this.obtenerDatosClase();
    this.obtenerTodosLosModulos();
    this.conectarWebSocket();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  private conectarWebSocket() {
    const sessionId = Number(this.claseId);
    if (isNaN(sessionId)) return;

    this.ws.connect(sessionId);
    this.ws.onEvent().subscribe(({ event, data }) => {
      switch (event) {
        case 'STUDENT_JOINED':
          this.alumnosConectados.push({
            codigo: data.studentId,
            estado: 'conectado',
            pares: '0/0',
            progreso: '0%',
            fallos: 0,
            tiempo: 0,
            puntaje: 0,
            paresCompletados: 0,
            totalPares: 0,
          });
          break;

        case 'STUDENT_ANSWERED':
          const alumno = this.alumnosConectados.find(a => a.codigo === data.studentId);
          if (alumno) alumno.estado = 'respondio';
          break;

        case 'NEW_QUESTION_LOADED':
          const totalItems = data.items?.length || 0;
          this.alumnosConectados.forEach(a => {
            a.estado = 'conectado';
            a.totalPares = totalItems;
            a.pares = `0/${totalItems}`;
            a.progreso = '0%';
          });
          break;

        case 'ROUND_SUMMARY':
          for (const r of data.results || []) {
            const al = this.alumnosConectados.find(a => a.codigo === r.playerId);
            if (!al) continue;
            al.estado = 'finalizado';
            al.puntaje = r.scoreObtained || 0;
            al.tiempo = Math.round(r.totalTimeSeconds || r.responseTimeSeconds || 0);
            const items = r.itemResults || [];
            const correctos = items.filter((i: any) => i.isCorrect).length;
            al.paresCompletados = correctos;
            al.totalPares = items.length;
            al.pares = `${correctos}/${items.length}`;
            al.progreso = items.length ? Math.round((correctos / items.length) * 100) + '%' : '0%';
            al.fallos = items.length - correctos;
          }
          break;

        case 'ROUND_CLOSED':
          if (data.sessionEnded) {
            this.alumnosConectados.forEach(a => {
              if (a.estado !== 'finalizado') a.estado = 'finalizado';
            });
          }
          break;
      }
    });
  }

  obtenerDatosClase() {
    this.claseActual = {
      id: this.claseId,
      sessionIdBackend: Number(this.claseId) || undefined,
      nombreCurso: 'Nueva Clase',
      fecha: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
      codigoPin: '',
      estado: 'en_curso',
      actividadesAsignadasIds: [],
      mostrarPistas: true,
      penalizacionPorFallo: 5,
      tiempoLimiteMinutos: 5
    };
    this.apiService.obtenerSesionPorId(Number(this.claseId)).subscribe({
      next: (datos) => {
        this.claseActual = datos.sesion;
        if (datos.modulos.length > 0) {
          this.modulosSeleccionados = datos.modulos;
          this.rondaIniciada = true;
        }
      },
      error: () => {}
    });
  }

  obtenerTodosLosModulos() {
    this.apiService.obtenerProblemas().subscribe((datos: any) => {
      this.todosLosModulos = datos;
    });
  }

  cambiarPestana(pestana: 'modulos' | 'parametros' | 'monitoreo') {
    this.pestanaActiva = pestana;
  }

  estaSeleccionado(id: string): boolean {
    return this.modulosSeleccionados.some(m => m.id === id);
  }

  toggleModulo(modulo: ActividadEmparejamiento) {
    console.log('toggleModulo', modulo.titulo, modulo.id, 'antes:', this.modulosSeleccionados.length);
    const exists = this.modulosSeleccionados.some(m => m.id === modulo.id);
    this.modulosSeleccionados = exists
      ? this.modulosSeleccionados.filter(m => m.id !== modulo.id)
      : [...this.modulosSeleccionados, modulo];
    console.log('toggleModulo despues:', this.modulosSeleccionados.length, this.modulosSeleccionados.map(m => m.id));
  }

  subirOrden(index: number) {
    if (index <= 0) return;
    [this.modulosSeleccionados[index - 1], this.modulosSeleccionados[index]] =
      [this.modulosSeleccionados[index], this.modulosSeleccionados[index - 1]];
  }

  bajarOrden(index: number) {
    if (index >= this.modulosSeleccionados.length - 1) return;
    [this.modulosSeleccionados[index], this.modulosSeleccionados[index + 1]] =
      [this.modulosSeleccionados[index + 1], this.modulosSeleccionados[index]];
  }

  guardarConfiguracion() {
    const sessionId = this.claseActual.sessionIdBackend;
    if (!sessionId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'ID de sesión no válido.' });
      return;
    }

    const questionIds = this.modulosSeleccionados
      .map(m => Number(m.id))
      .filter(id => !isNaN(id));

    if (questionIds.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin módulos', text: 'Selecciona al menos un módulo para la clase.' });
      return;
    }

    const timePerQuestionSeconds = this.claseActual.tiempoLimiteMinutos > 0
      ? this.claseActual.tiempoLimiteMinutos * 60
      : 30;

    this.apiService.iniciarRonda(sessionId, questionIds, timePerQuestionSeconds, Math.ceil(questionIds.length * timePerQuestionSeconds / 60)).subscribe({
      next: () => {
        this.rondaIniciada = true;
        Swal.fire({
          title: 'Clase Iniciada',
          text: 'Los estudiantes ya pueden conectarse.',
          icon: 'success',
          confirmButtonColor: '#2e7d32',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: (err) => {
        console.error('Error al iniciar ronda', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo iniciar la clase en el servidor.' });
      }
    });
  }
}
