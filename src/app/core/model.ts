/**
 * Representa una actividad de emparejamiento (matching) en el sistema.
 * Es la estructura principal que agrupa los conceptos que el alumno debe resolver.
 */
export interface ActividadEmparejamiento {
  /** Identificador único de la actividad. Es opcional al crear una nueva antes de guardarla en la base de datos. */
  id?: string;
  /** Título principal de la actividad. */
  titulo: string;            
  /** Asignatura a la que pertenece la actividad. */
  asignatura: string;       
  /** Descripción general o instrucciones de la actividad. */
  descripcion: string;
  /** Arreglo de pares (concepto y definición) que componen el ejercicio. */
  pares: ParConceptoDefinicion[];
}

/**
 * Define un par individual dentro de una actividad de emparejamiento.
 * Utilizado por el motor del juego VR para validar si la unión es correcta.
 */
export interface ParConceptoDefinicion {
  /** El concepto principal a emparejar. */
  concepto: string;
  /** La definición que corresponde al concepto. */
  definicion: string;
  /** Información adicional opcional que podría servir como pista o contexto. */
  descripcion?: string;
}

/**
 * Representa una sesión de clase activa o finalizada.
 * Orquesta la configuración de la partida y conecta el entorno web con la experiencia en VR.
 */
export interface SesionClase {
  /** Identificador único de la sesión en el frontend. */
  id?: string;
  /** Identificador de la sesión generado por el backend en NestJS. */
  sessionIdBackend?: number;
  /** Nombre asignado al curso o la clase en particular. */
  nombreCurso: string;
  /** Fecha de creación o ejecución de la sesión. */
  fecha: string;
  /** Código único que los alumnos usan para unirse a la sesión desde la aplicación VR. */
  codigoPin: string;
  /** Estado actual de la sesión. */
  estado: 'en_curso' | 'finalizada';
  /** Lista de identificadores de las actividades de emparejamiento asignadas a esta sesión. */
  actividadesAsignadasIds: string[];
  /** Determina si se habilitan ayudas visuales o pistas dentro de la aplicación XR. */
  mostrarPistas: boolean;
  /** Puntos o segundos restados por cada intento fallido del alumno. */
  penalizacionPorFallo: number;
  /** Tiempo máximo permitido para completar la sesión, expresado en minutos. */
  tiempoLimiteMinutos: number;
  /** Datos completos de las actividades asociadas. */
  modulos?: ActividadEmparejamiento[];
}

/**
 * Registra el rendimiento global de un alumno en una sesión específica.
 * Ideal para generar reportes y estadísticas al finalizar la clase.
 */
export interface RendimientoAlumno {
  /** ID de la sesión a la que pertenece este registro. */
  idSesion: string;
  /** Nombre de la clase o sesión para referencia rápida. */
  nombreClase: string;
  /** Identificador único del alumno que participó. */
  codigoAlumno: string;
  /** Estado de la participación del alumno en esa sesión. */
  estado: 'en_curso' | 'finalizado';
  /** Cantidad de pares unidos correctamente. */
  paresCompletados: number;
  /** Cantidad total de pares que debían resolverse. */
  totalPares: number;
  /** Cantidad de veces que el alumno emparejó incorrectamente. */
  intentosFallidos: number;
  /** Tiempo total invertido en la actividad, medido en segundos. */
  tiempoSegundos: number;
  /** Calificación o puntaje final calculado tras aplicar penalizaciones. */
  puntajeFinal: number;
}

/**
 * Representa el estado en tiempo real o el resumen de un alumno dentro de una sesión activa.
 * Utilizado para mostrar métricas en el panel de control del profesor.
 */
export interface AlumnoSesion {
  /** Código o identificador del alumno. */
  codigo: string;
  /** Estado de conexión y actividad del alumno. */
  estado: 'conectado' | 'respondio' | 'finalizado';
  /** Texto descriptivo de los pares completados (ej. "3/5"). */
  pares: string;
  /** Porcentaje o texto que indica cuánto ha avanzado en la actividad. */
  progreso: string;
  /** Número de equivocaciones cometidas durante la sesión. */
  fallos: number;
  /** Tiempo transcurrido en la actividad. */
  tiempo: number;
  /** Puntaje acumulado en el momento actual. */
  puntaje: number;
  /** Número entero de pares completados exitosamente. */
  paresCompletados: number;
  /** Número entero de pares totales de la actividad. */
  totalPares: number;
}