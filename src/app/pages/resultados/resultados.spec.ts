import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultadosComponent } from './resultados';
import { ApiService } from '../../core/api';
import { of, throwError } from 'rxjs';

describe('ResultadosComponent', () => {
  let component: ResultadosComponent;
  let fixture: ComponentFixture<ResultadosComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // ARRANGE
  const mockSesiones = [
    { sessionIdBackend: 1, nombreCurso: 'Odontopediatría' },
    { sessionIdBackend: 2, nombreCurso: 'Endodoncia' }
  ] as any[];

  const mockLogs = [
    {
      sessionId: 1,
      playerId: 'ALU001',
      scoreObtained: 50,
      totalTimeSeconds: 30.5,
      selectedAlternative: JSON.stringify([{ isCorrect: true }, { isCorrect: false }])
    },
    {
      sessionId: 1,
      playerId: 'ALU001',
      scoreObtained: 20,
      totalTimeSeconds: 15,
      selectedAlternative: JSON.stringify([{ isCorrect: true }])
    },
    {
      sessionId: 2,
      playerId: 'ALU002',
      scoreObtained: 100,
      totalTimeSeconds: 60,
      // Simular un error en la base de datos: un JSON roto.
      selectedAlternative: 'esto-no-es-un-json-valido' 
    }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['obtenerTodasLasSesiones', 'obtenerReporteGlobal']);

    await TestBed.configureTestingModule({
      imports: [ResultadosComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResultadosComponent);
    component = fixture.componentInstance;
  });


  it('debería agrupar logs, calcular métricas y ordenar alfabéticamente (Flujo Feliz)', () => {
    // ARRANGE
    mockApiService.obtenerTodasLasSesiones.and.returnValue(of(mockSesiones));
    mockApiService.obtenerReporteGlobal.and.returnValue(of(mockLogs));

    // ACT
    fixture.detectChanges();

    // ASSERT
    expect(component.cargando).toBeFalse();
    expect(component.registros.length).toBe(2);
    
    const registroEndodoncia = component.registros[0];
    const registroOdonto = component.registros[1];
    
    expect(registroEndodoncia.nombreClase).toBe('Endodoncia');
    expect(registroOdonto.nombreClase).toBe('Odontopediatría');
    expect(registroOdonto.codigoAlumno).toBe('ALU001');
    expect(registroOdonto.puntajeFinal).toBe(70);
    expect(registroOdonto.tiempoSegundos).toBe(46);
    expect(registroOdonto.paresCompletados).toBe(2);
    expect(registroOdonto.intentosFallidos).toBe(1);
    expect(registroOdonto.totalPares).toBe(3);
    expect(registroEndodoncia.codigoAlumno).toBe('ALU002');
    expect(registroEndodoncia.paresCompletados).toBe(0); 
  });


  it('debería procesar el reporte con nombres genéricos si falla obtenerTodasLasSesiones', () => {
    // ARRANGE
    mockApiService.obtenerTodasLasSesiones.and.returnValue(throwError(() => new Error('API caída')));
    mockApiService.obtenerReporteGlobal.and.returnValue(of([mockLogs[0]]));

    // ACT
    fixture.detectChanges();

    // ASSERT
    expect(component.registros[0].nombreClase).toBe('Sesión #1');
    expect(component.cargando).toBeFalse();
  });

  it('debería limpiar la tabla y quitar el spinner si falla obtenerReporteGlobal', () => {
    // ARRANGE
    mockApiService.obtenerTodasLasSesiones.and.returnValue(of(mockSesiones));
    mockApiService.obtenerReporteGlobal.and.returnValue(throwError(() => new Error('DB caída')));

    // ACT
    fixture.detectChanges();

    // ASSERT
    expect(component.registros.length).toBe(0);
    expect(component.registrosFiltrados.length).toBe(0);
    expect(component.cargando).toBeFalse();
  });


  it('debería aplicar filtros por sesión correctamente', () => {
    // ARRANGE
    mockApiService.obtenerTodasLasSesiones.and.returnValue(of(mockSesiones));
    mockApiService.obtenerReporteGlobal.and.returnValue(of(mockLogs));
    fixture.detectChanges();

    // ACT: Filtrar por sesión 1
    component.filtroClaseSeleccionada = '1';
    component.aplicarFiltro();

    // ASSERT
    expect(component.registrosFiltrados.length).toBe(1);
    expect(component.registrosFiltrados[0].idSesion).toBe('1');

    // ACT: Restaurar el filtro
    component.filtroClaseSeleccionada = 'Todas';
    component.aplicarFiltro();

    // ASSERT
    expect(component.registrosFiltrados.length).toBe(2);
  });

  it('debería formatear los segundos a formato MM:SS correctamente', () => {
    expect(component.formatearTiempo(0)).toBe('0:00');
    expect(component.formatearTiempo(9)).toBe('0:09');
    expect(component.formatearTiempo(59)).toBe('0:59');
    expect(component.formatearTiempo(60)).toBe('1:00');
    expect(component.formatearTiempo(65)).toBe('1:05');
    expect(component.formatearTiempo(125)).toBe('2:05');
  });
});