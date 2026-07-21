import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ActividadEmparejamiento, SesionClase } from './model';

interface BackendExercise {
  id: number;
  title: string;
  asignatura: string | null;
  descripcion: string | null;
  createdAt: string;
  categories: { id: number; name: string; descripcion: string | null; exerciseId: number }[];
  items: { id: number; textContent: string; exerciseId: number; correctCategoryId: number }[];
}

interface BackendCategory { name: string; descripcion?: string }
interface BackendItem { textContent: string; correctCategoryIndex: number }

interface BackendSession {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface BackendSessionDetail extends BackendSession {
  questionOrder: string | null;
  exercises: BackendExercise[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private mapToFrontend(ex: BackendExercise): ActividadEmparejamiento {
    const itemsSorted = [...ex.items].sort((a, b) => a.correctCategoryId - b.correctCategoryId);
    return {
      id: String(ex.id),
      titulo: ex.title,
      asignatura: ex.asignatura || '',
      descripcion: ex.descripcion || '',
      pares: ex.categories.map((cat, i) => ({
        concepto: cat.name,
        definicion: itemsSorted[i]?.textContent || '',
        descripcion: cat.descripcion || undefined,
      })),
    };
  }

  private exerciseToBackend(modulo: ActividadEmparejamiento) {
    return {
      title: modulo.titulo,
      asignatura: modulo.asignatura || undefined,
      descripcion: modulo.descripcion || undefined,
      categories: modulo.pares.map(p => ({ name: p.concepto, descripcion: p.descripcion || undefined })),
      items: modulo.pares.map((p, i) => ({ textContent: p.definicion, correctCategoryIndex: i })),
    };
  }

  private sessionToFrontend(s: BackendSession): SesionClase {
    return {
      id: String(s.id),
      sessionIdBackend: s.id,
      nombreCurso: s.name,
      fecha: new Date(s.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
      codigoPin: '',
      estado: s.isActive ? 'en_curso' : 'finalizada',
      actividadesAsignadasIds: [],
      mostrarPistas: false,
      penalizacionPorFallo: 0,
      tiempoLimiteMinutos: 0,
    };
  }

  obtenerProblemas(): Observable<ActividadEmparejamiento[]> {
    return this.http.get<BackendExercise[]>(`http://localhost:3000/content/exercises`).pipe(
      map(lista => lista.map(ex => this.mapToFrontend(ex)))
    );
  }

  obtenerModuloPorId(id: string): Observable<ActividadEmparejamiento> {
    return this.http.get<BackendExercise>(`http://localhost:3000/content/exercise/${id}`).pipe(
      map(ex => this.mapToFrontend(ex))
    );
  }

  crearModulo(modulo: ActividadEmparejamiento): Observable<any> {
    return this.http.post(`http://localhost:3000/content/exercise`, this.exerciseToBackend(modulo));
  }

  actualizarModulo(id: string, modulo: ActividadEmparejamiento): Observable<any> {
    return this.http.patch(`http://localhost:3000/content/exercise/${id}`, this.exerciseToBackend(modulo));
  }

  crearSesion(nombre: string): Observable<SesionClase> {
    return this.http.post<BackendSession>(`http://localhost:3000/gamification/session`, { name: nombre }).pipe(
      map(s => this.sessionToFrontend(s))
    );
  }

  obtenerSesionesActivas(): Observable<SesionClase[]> {
    return this.http.get<BackendSession[]>(`http://localhost:3000/gamification/active-sessions`).pipe(
      map(lista => lista.map(s => this.sessionToFrontend(s)))
    );
  }

  obtenerTodasLasSesiones(): Observable<SesionClase[]> {
    return this.http.get<BackendSession[]>(`http://localhost:3000/gamification/sessions`).pipe(
      map(lista => lista.map(s => this.sessionToFrontend(s)))
    );
  }

  obtenerSesionPorId(id: number): Observable<{
    sesion: SesionClase;
    modulos: ActividadEmparejamiento[];
  }> {
    return this.http.get<BackendSessionDetail>(`http://localhost:3000/gamification/session/${id}`).pipe(
      map(detalle => ({
        sesion: this.sessionToFrontend(detalle),
        modulos: (detalle.exercises || []).map(ex => this.mapToFrontend(ex)),
      }))
    );
  }

  iniciarRonda(sessionId: number, questionIds: number[], timePerQuestionSeconds: number, totalRoundTimeMinutes: number): Observable<any> {
    return this.http.post(`http://localhost:3000/gamification/start-round-flow`, {
      sessionId,
      questionIds,
      timePerQuestionSeconds,
      totalRoundTimeMinutes,
    });
  }

  cerrarSesion(sessionId: number): Observable<any> {
    return this.http.post(`http://localhost:3000/gamification/close-session/${sessionId}`, {});
  }

  eliminarModuloBackend(id: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/content/exercise/${id}`);
  }

  obtenerReporteGlobal(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/statistics/report`);
  }

  obtenerReportePorSesion(sessionId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/statistics/report/session/${sessionId}`);
  }
}
