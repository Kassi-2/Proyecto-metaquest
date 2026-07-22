import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { RendimientoAlumno, SesionClase } from '../../core/model';

/**
 * Componente dedicado a la visualización y análisis de los resultados de los estudiantes.
 * Actúa como un motor de procesamiento de datos: extrae logs crudos desde el backend,
 * los cruza con la información de las sesiones activas/finalizadas y los transforma 
 * en métricas de rendimiento consolidadas para el modelo de gobierno de datos.
 */
@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {
  private apiService = inject(ApiService);

  /** Almacena el consolidado total de los rendimientos de todos los alumnos en todas las sesiones. */
  registros: RendimientoAlumno[] = [];
  
  /** Subconjunto de registros que se muestra actualmente en la tabla, afectado por los filtros de la UI. */
  registrosFiltrados: RendimientoAlumno[] = [];
  
  /** Lista de clases únicas extraídas de los logs para poblar el selector (dropdown) de filtros. */
  clasesDisponibles: { id: string; nombre: string }[] = [];
  
  /** Modelo de datos bidireccional vinculado al selector de clases. Por defecto muestra 'Todas'. */
  filtroClaseSeleccionada: string = 'Todas';
  
  /** Indicador de estado para mostrar un spinner o mensaje de carga mientras se procesan los datos. */
  cargando = true;

  /**
   * Ciclo de vida: Inicializa el componente.
   * Primero, obtiene todas las sesiones registradas para crear un diccionario (Map) 
   * que relaciona el ID de la sesión con su nombre legible. Luego, encadena la carga del reporte global.
   */
  ngOnInit(): void {
    this.apiService.obtenerTodasLasSesiones().subscribe({
      next: (sesiones) => {
        const mapaSesiones = new Map<number, string>();
        for (const s of sesiones) {
          if (s.sessionIdBackend) mapaSesiones.set(s.sessionIdBackend, s.nombreCurso);
        }
        this.cargarReporte(mapaSesiones);
      },
      // En caso de error al obtener las sesiones, se continúa con un mapa vacío 
      // para no bloquear la renderización de los resultados crudos.
      error: () => this.cargarReporte(new Map()), 
    });
  }

  /**
   * Solicita el log de eventos global al backend y coordina su transformación.
   * 
   * @param mapaSesiones - Diccionario para traducir IDs numéricos de sesión a nombres de cursos.
   */
  private cargarReporte(mapaSesiones: Map<number, string>) {
    this.apiService.obtenerReporteGlobal().subscribe({
      next: (logs) => {
        this.registros = this.transformarLogs(logs, mapaSesiones);
        this.registrosFiltrados = [...this.registros];
        
        // Extrae valores únicos para el filtro de clases usando un Map temporal
        this.clasesDisponibles = Array.from(
          new Map(this.registros.map(r => [r.idSesion, { id: r.idSesion, nombre: r.nombreClase }])).values()
        );
        this.cargando = false;
      },
      error: () => {
        this.registros = [];
        this.registrosFiltrados = [];
        this.cargando = false;
      },
    });
  }

  /**
   * Motor principal de procesamiento de datos. 
   * Toma un arreglo lineal de eventos (logs) y los agrupa por la combinación única de `sessionId` y `playerId`.
   * Parsea cadenas JSON anidadas para calcular aciertos, fallos y tiempos consolidados.
   * 
   * @param logs - Arreglo de eventos crudos provenientes del servidor.
   * @param mapaSesiones - Diccionario para asignar el nombre de la clase al registro final.
   * @returns Un arreglo estructurado y ordenado alfabéticamente de tipo `RendimientoAlumno`.
   */
  private transformarLogs(logs: any[], mapaSesiones: Map<number, string>): RendimientoAlumno[] {
    const agrupado = new Map<string, {
      sessionId: number;
      playerId: string;
      scoreObtained: number;
      totalTimeSeconds: number;
      itemResults: { isCorrect: boolean }[];
    }>();

    // 1. Agrupación y consolidación de eventos
    for (const log of logs) {
      const key = `${log.sessionId}|${log.playerId}`;
      let grupo = agrupado.get(key);
      
      if (!grupo) {
        grupo = { sessionId: log.sessionId, playerId: log.playerId, scoreObtained: 0, totalTimeSeconds: 0, itemResults: [] };
        agrupado.set(key, grupo);
      }
      
      grupo.scoreObtained += log.scoreObtained || 0;
      grupo.totalTimeSeconds += log.totalTimeSeconds || 0;
      
      try {
        // Intenta parsear la alternativa seleccionada almacenada como string JSON
        const items = JSON.parse(log.selectedAlternative || '[]');
        if (Array.isArray(items)) {
          grupo.itemResults.push(...items.map((i: any) => ({ isCorrect: !!i.isCorrect })));
        }
      } catch { 
        // Si el JSON es inválido, se ignora silenciosamente para no detener el ciclo
      }
    }

    // 2. Cálculo de métricas finales por alumno/sesión
    const resultado: RendimientoAlumno[] = [];
    for (const grupo of agrupado.values()) {
      const correctos = grupo.itemResults.filter(i => i.isCorrect).length;
      const total = grupo.itemResults.length;
      
      resultado.push({
        idSesion: String(grupo.sessionId),
        nombreClase: mapaSesiones.get(grupo.sessionId) || `Sesión #${grupo.sessionId}`,
        codigoAlumno: grupo.playerId,
        estado: 'finalizado',
        paresCompletados: correctos,
        totalPares: total,
        intentosFallidos: total - correctos,
        tiempoSegundos: Math.round(grupo.totalTimeSeconds),
        puntajeFinal: grupo.scoreObtained,
      });
    }

    // 3. Ordenamiento: Primero por nombre de clase, luego por identificador del alumno
    resultado.sort((a, b) => a.nombreClase.localeCompare(b.nombreClase) || a.codigoAlumno.localeCompare(b.codigoAlumno));
    return resultado;
  }

  /**
   * Aplica el filtro seleccionado en la interfaz de usuario.
   * Si se selecciona 'Todas', restaura la lista completa; de lo contrario, 
   * filtra los registros por el ID de la sesión escogida.
   */
  aplicarFiltro() {
    if (this.filtroClaseSeleccionada === 'Todas') {
      this.registrosFiltrados = [...this.registros];
    } else {
      this.registrosFiltrados = this.registros.filter(r => r.idSesion === this.filtroClaseSeleccionada);
    }
  }

  /**
   * Utilidad visual para formatear los segundos crudos en una cadena legible MM:SS.
   * 
   * @param segundos - Cantidad total de segundos.
   * @returns Un string formateado, por ejemplo, "03:05".
   */
  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.round(segundos % 60);
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`;
  }
}