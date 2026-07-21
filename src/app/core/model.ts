export interface ActividadEmparejamiento {
  id?: string;
  titulo: string;            
  asignatura: string;       
  descripcion: string;
  pares: ParConceptoDefinicion[];
}
export interface ParConceptoDefinicion {
  concepto: string;
  definicion: string;
  descripcion?: string;
}

export interface SesionClase {
  id?: string;
  sessionIdBackend?: number;
  nombreCurso: string;
  fecha: string;
  codigoPin: string;
  estado: 'en_curso' | 'finalizada';
  actividadesAsignadasIds: string[];
  mostrarPistas: boolean;
  penalizacionPorFallo: number;
  tiempoLimiteMinutos: number;
  modulos?: ActividadEmparejamiento[];
}

export interface RendimientoAlumno {
  idSesion: string;
  nombreClase: string;
  codigoAlumno: string;
  estado: 'en_curso' | 'finalizado';
  paresCompletados: number;
  totalPares: number;
  intentosFallidos: number;
  tiempoSegundos: number;
  puntajeFinal: number;
}

export interface AlumnoSesion {
  codigo: string;
  estado: 'conectado' | 'respondio' | 'finalizado';
  pares: string;
  progreso: string;
  fallos: number;
  tiempo: number;
  puntaje: number;
  paresCompletados: number;
  totalPares: number;
}