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
  private apiService = inject(ApiService);

  registros: RendimientoAlumno[] = [];
  registrosFiltrados: RendimientoAlumno[] = [];
  clasesDisponibles: { id: string; nombre: string }[] = [];
  filtroClaseSeleccionada: string = 'Todas';
  cargando = true;

  ngOnInit(): void {
    this.apiService.obtenerTodasLasSesiones().subscribe({
      next: (sesiones) => {
        const mapaSesiones = new Map<number, string>();
        for (const s of sesiones) {
          if (s.sessionIdBackend) mapaSesiones.set(s.sessionIdBackend, s.nombreCurso);
        }
        this.cargarReporte(mapaSesiones);
      },
      error: () => this.cargarReporte(new Map()),
    });
  }

  private cargarReporte(mapaSesiones: Map<number, string>) {
    this.apiService.obtenerReporteGlobal().subscribe({
      next: (logs) => {
        this.registros = this.transformarLogs(logs, mapaSesiones);
        this.registrosFiltrados = [...this.registros];
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

  private transformarLogs(logs: any[], mapaSesiones: Map<number, string>): RendimientoAlumno[] {
    const agrupado = new Map<string, {
      sessionId: number;
      playerId: string;
      scoreObtained: number;
      totalTimeSeconds: number;
      itemResults: { isCorrect: boolean }[];
    }>();

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
        const items = JSON.parse(log.selectedAlternative || '[]');
        if (Array.isArray(items)) {
          grupo.itemResults.push(...items.map((i: any) => ({ isCorrect: !!i.isCorrect })));
        }
      } catch { }
    }

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

    resultado.sort((a, b) => a.nombreClase.localeCompare(b.nombreClase) || a.codigoAlumno.localeCompare(b.codigoAlumno));
    return resultado;
  }

  aplicarFiltro() {
    if (this.filtroClaseSeleccionada === 'Todas') {
      this.registrosFiltrados = [...this.registros];
    } else {
      this.registrosFiltrados = this.registros.filter(r => r.idSesion === this.filtroClaseSeleccionada);
    }
  }

  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.round(segundos % 60);
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`;
  }
}
