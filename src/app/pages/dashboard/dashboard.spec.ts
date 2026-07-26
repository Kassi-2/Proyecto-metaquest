import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { ApiService } from '../../core/api';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  
  let mockApiService: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockSesiones = [
    { id: '1', nombreCurso: 'Clase A', estado: 'en_curso', sessionIdBackend: 101 },
    { id: '2', nombreCurso: 'Clase B', estado: 'finalizada', sessionIdBackend: 102 },
    { id: '3', nombreCurso: 'Taller C', estado: 'finalizada', sessionIdBackend: 103 },
  ] as any[];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'obtenerProblemas',
      'obtenerTodasLasSesiones',
      'obtenerSesionesActivas',
      'obtenerSesionPorId',
      'crearSesion',
      'eliminarModuloBackend',
      'cerrarSesion'
    ]);

    mockApiService.obtenerProblemas.and.returnValue(of([{ id: 'm1', titulo: 'Módulo 1' }] as any));
    mockApiService.obtenerTodasLasSesiones.and.returnValue(of([...mockSesiones]));
    mockApiService.obtenerSesionPorId.and.returnValue(of({ modulos: [] } as any));
    
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]), // Proveedor oficial de rutas para Angular moderno
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    // Obtenemos el router real de la inyección y espíamos su método navigate
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    
    fixture.detectChanges(); 
  });


  it('debería cargar módulos y sesiones al inicializar', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.obtenerProblemas).toHaveBeenCalled();
    expect(mockApiService.obtenerTodasLasSesiones).toHaveBeenCalled();
    expect(component.todasLasSesiones.length).toBe(3);
    expect(mockApiService.obtenerSesionPorId).toHaveBeenCalledTimes(3); 
  });

  it('debería separar correctamente las sesiones activas de las finalizadas', () => {
    expect(component.sesionesActivas.length).toBe(1);
    expect(component.sesionesActivas[0].nombreCurso).toBe('Clase A');
    expect(component.historialClases.length).toBe(2);
  });

  it('debería filtrar el historial por nombre', () => {
    component.filtroNombre = 'Taller';
    const filtrado = component.historialFiltrado;
    expect(filtrado.length).toBe(1);
    expect(filtrado[0].nombreCurso).toBe('Taller C');
  });

  it('debería calcular correctamente la paginación', () => {
    component.cambiarTamanoPagina(1);
    expect(component.totalPaginas).toBe(2);
    expect(component.historialPaginado.length).toBe(1);
    expect(component.historialPaginado[0].nombreCurso).toBe('Clase B');

    component.cambiarPagina(2);
    expect(component.historialPaginado[0].nombreCurso).toBe('Taller C');
  });

  it('debería usar el fallback y obtener solo sesiones activas si falla obtenerTodasLasSesiones', () => {
    mockApiService.obtenerTodasLasSesiones.and.returnValue(throwError(() => new Error('Error de red')));
    mockApiService.obtenerSesionesActivas.and.returnValue(of([{ id: '1', nombreCurso: 'Clase A', estado: 'en_curso' } as any]));
    
    component.cargarSesiones();

    expect(mockApiService.obtenerSesionesActivas).toHaveBeenCalled();
    expect(component.todasLasSesiones.length).toBe(1);
  });

  it('debería crear una nueva sesión y navegar a su configuración', () => {
    const nuevaClase = { id: '99', nombreCurso: 'Nueva Clase' } as any;
    mockApiService.crearSesion.and.returnValue(of(nuevaClase));

    component.iniciarSesionClase();

    expect(mockApiService.crearSesion).toHaveBeenCalledWith('Nueva Clase');
    expect(component.todasLasSesiones[0].id).toBe('99');
    expect(router.navigate).toHaveBeenCalledWith(['/clase-config', '99']);
  });

  it('debería eliminar un módulo tras confirmar', fakeAsync(() => {
    const moduloAEliminar = { id: 'm1', titulo: 'Módulo 1' } as any;
    component.modulos = [moduloAEliminar];
    mockApiService.eliminarModuloBackend.and.returnValue(of({} as any));

    component.eliminarModulo(moduloAEliminar);
    tick();

    expect(mockApiService.eliminarModuloBackend).toHaveBeenCalledWith('m1');
    expect(component.modulos.length).toBe(0);
  }));

  it('debería finalizar una sesión tras confirmar y actualizar su estado', fakeAsync(() => {
    const sesionAFinalizar = component.todasLasSesiones.find(s => s.id === '1');
    mockApiService.cerrarSesion.and.returnValue(of({} as any));

    component.finalizarSesion(sesionAFinalizar!);
    tick();

    expect(mockApiService.cerrarSesion).toHaveBeenCalledWith(101);
    const sesionActualizada = component.todasLasSesiones.find(s => s.id === '1');
    expect(sesionActualizada?.estado).toBe('finalizada');
  }));
});