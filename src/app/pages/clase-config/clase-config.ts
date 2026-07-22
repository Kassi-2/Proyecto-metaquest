import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { WebSocketService } from '../../core/websocket.service';
import { ActividadEmparejamiento, SesionClase, AlumnoSesion } from '../../core/model';
import Swal from 'sweetalert2';

/**
 * Componente principal para la configuración y monitoreo de una sesión de clase.
 * Permite al profesor seleccionar módulos de emparejamiento, ajustar parámetros de tiempo/penalización,
 * y observar en tiempo real el progreso de los estudiantes conectados desde la aplicación VR.
 */
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

  /** Controla la vista actual del panel: selección de módulos, ajuste de parámetros o monitoreo en vivo. */
  pestanaActiva: 'modulos' | 'parametros' | 'monitoreo' = 'modulos';
  
  /** Identificador de la clase capturado desde la URL. */
  claseId!: string;
  
  /** Almacena la configuración actual y metadatos de la sesión de clase. */
  claseActual!: SesionClase;
  
  /** Lista completa de módulos de emparejamiento disponibles en el sistema. */
  todosLosModulos: ActividadEmparejamiento[] = [];
  
  /** Lista de módulos seleccionados y ordenados por el profesor para la sesión actual. */
  modulosSeleccionados: ActividadEmparejamiento[] = [];
  
  /** Bandera que indica si la ronda ya fue enviada al backend y está activa para los alumnos. */
  rondaIniciada = false;
  
  /** Arreglo en memoria que mantiene el estado en tiempo real de los alumnos conectados. */
  alumnosConectados: AlumnoSesion[] = [];

  /**
   * Ciclo de vida: Inicializa el componente recuperando el ID de la ruta,
   * cargando los datos iniciales y estableciendo la conexión WebSocket.
   */
  ngOnInit(): void {
    this.claseId = this.route.snapshot.paramMap.get('id') || '';
    this.obtenerDatosClase();
    this.obtenerTodosLosModulos();
    this.conectarWebSocket();
  }

  /**
   * Ciclo de vida: Limpia los recursos al destruir el componente.
   * Es crítico desconectar el WebSocket para evitar fugas de memoria y mensajes duplicados.
   */
  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  /**
   * Establece y gestiona la conexión bidireccional en tiempo real con el servidor.
   * Escucha eventos específicos (emitidos desde el backend o la aplicación VR)
   * para actualizar el estado del panel de monitoreo.
   */
  private conectarWebSocket() {
    const sessionId = Number(this.claseId);
    if (isNaN(sessionId)) return;

    this.ws.connect(sessionId);
    this.ws.onEvent().subscribe(({ event, data }) => {
      switch (event) {
        // Un nuevo alumno ingresó el PIN y entró a la sala virtual.
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

        // Un alumno interactuó con un elemento (ej. intentó unir un par).
        case 'STUDENT_ANSWERED':
          const alumno = this.alumnosConectados.find(a => a.codigo === data.studentId);
          if (alumno) alumno.estado = 'respondio';
          break;

        // La ronda inicia y se carga una nueva pregunta/módulo para todos.
        case 'NEW_QUESTION_LOADED':
          const totalItems = data.items?.length || 0;
          this.alumnosConectados.forEach(a => {
            a.estado = 'conectado';
            a.totalPares = totalItems;
            a.pares = `0/${totalItems}`;
            a.progreso = '0%';
          });
          break;

        // Fin de la ronda: el backend envía los resultados calculados.
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

        // Cierre definitivo de la sesión.
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

  /**
   * Obtiene la configuración guardada de la clase desde la API.
   * Si la clase ya tiene módulos asignados, restaura el estado y marca la ronda como iniciada.
   */
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
      error: () => {} // Aquí podrías agregar un SweetAlert en el futuro si falla la carga
    });
  }

  /**
   * Carga el catálogo completo de problemas o módulos disponibles en la base de datos.
   */
  obtenerTodosLosModulos() {
    this.apiService.obtenerProblemas().subscribe((datos: any) => {
      this.todosLosModulos = datos;
    });
  }

  /**
   * Cambia la pestaña activa en la interfaz de usuario.
   * @param pestana - El identificador de la pestaña a mostrar ('modulos', 'parametros' o 'monitoreo').
   */
  cambiarPestana(pestana: 'modulos' | 'parametros' | 'monitoreo') {
    this.pestanaActiva = pestana;
  }

  /**
   * Verifica si un módulo específico ya está en la lista de seleccionados.
   * Útil para renderizar el estado activo/inactivo de botones en la UI.
   * 
   * @param id - El identificador del módulo.
   * @returns `true` si el módulo está seleccionado, `false` en caso contrario.
   */
  estaSeleccionado(id: string): boolean {
    return this.modulosSeleccionados.some(m => m.id === id);
  }

  /**
   * Agrega un módulo a la selección si no existe, o lo elimina si ya estaba seleccionado.
   * 
   * @param modulo - El objeto completo de la actividad de emparejamiento.
   */
  toggleModulo(modulo: ActividadEmparejamiento) {
    console.log('toggleModulo', modulo.titulo, modulo.id, 'antes:', this.modulosSeleccionados.length);
    const exists = this.modulosSeleccionados.some(m => m.id === modulo.id);
    this.modulosSeleccionados = exists
      ? this.modulosSeleccionados.filter(m => m.id !== modulo.id)
      : [...this.modulosSeleccionados, modulo];
    console.log('toggleModulo despues:', this.modulosSeleccionados.length, this.modulosSeleccionados.map(m => m.id));
  }

  /**
   * Mueve un módulo seleccionado una posición hacia arriba en la lista.
   * El orden de esta lista determina la secuencia de aparición en la experiencia inmersiva.
   * 
   * @param index - Posición actual del módulo en el arreglo.
   */
  subirOrden(index: number) {
    if (index <= 0) return;
    [this.modulosSeleccionados[index - 1], this.modulosSeleccionados[index]] =
      [this.modulosSeleccionados[index], this.modulosSeleccionados[index - 1]];
  }

  /**
   * Mueve un módulo seleccionado una posición hacia abajo en la lista.
   * 
   * @param index - Posición actual del módulo en el arreglo.
   */
  bajarOrden(index: number) {
    if (index >= this.modulosSeleccionados.length - 1) return;
    [this.modulosSeleccionados[index], this.modulosSeleccionados[index + 1]] =
      [this.modulosSeleccionados[index + 1], this.modulosSeleccionados[index]];
  }

  /**
   * Construye el payload de configuración y envía la orden al backend para iniciar la clase.
   * Calcula los tiempos requeridos y emite notificaciones visuales al profesor.
   */
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

    // Calcula el tiempo en segundos en base al límite en minutos establecido.
    const timePerQuestionSeconds = this.claseActual.tiempoLimiteMinutos > 0
      ? this.claseActual.tiempoLimiteMinutos * 60
      : 30;

    this.apiService.iniciarRonda(
      sessionId, 
      questionIds, 
      timePerQuestionSeconds, 
      Math.ceil(questionIds.length * timePerQuestionSeconds / 60)
    ).subscribe({
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