import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClaseConfigComponent } from './clase-config';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api';
import { WebSocketService } from '../../core/websocket.service';
import { of, Subject } from 'rxjs';
import { ActividadEmparejamiento } from '../../core/model';
import Swal from 'sweetalert2';

describe('ClaseConfigComponent', () => {
  let component: ClaseConfigComponent;
  let fixture: ComponentFixture<ClaseConfigComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockWsService: jasmine.SpyObj<WebSocketService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let wsEventSubject: Subject<any>;

  beforeEach(async () => {
    
    // Fingir router
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    // Fingir la API
    mockApiService = jasmine.createSpyObj('ApiService', ['obtenerSesionPorId', 'obtenerProblemas', 'iniciarRonda']);
    // Configurar qué deben devolver
    mockApiService.obtenerSesionPorId.and.returnValue(of({ 
      sesion: { id: '123' }, 
      modulos: [] 
    } as any));
    mockApiService.obtenerProblemas.and.returnValue(of([]));
    mockApiService.iniciarRonda.and.returnValue(of({}));

    // Fingir el WebSocket
    mockWsService = jasmine.createSpyObj('WebSocketService', ['connect', 'disconnect', 'onEvent']);
    // Crear un Subject para poder emitir eventos WebSocket
    wsEventSubject = new Subject();
    mockWsService.onEvent.and.returnValue(wsEventSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [ClaseConfigComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: WebSocketService, useValue: mockWsService },
        { provide: Router, useValue: mockRouter },
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '123' } } } // Simular que la URL tiene el ID 123
        }
      ]
    }).compileComponents();

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    fixture = TestBed.createComponent(ClaseConfigComponent);
    component = fixture.componentInstance;
    
    fixture.detectChanges(); 
  });


  it('debería crear el componente e inicializar datos en ngOnInit', () => {
    // ASSERT
    expect(component).toBeTruthy();
    expect(component.claseId).toBe('123');
    expect(mockApiService.obtenerSesionPorId).toHaveBeenCalledWith(123);
    expect(mockWsService.connect).toHaveBeenCalledWith(123);
  });

  it('debería desconectar el WebSocket al destruir el componente (ngOnDestroy)', () => {
    // ACT
    component.ngOnDestroy();

    // ASSERT
    expect(mockWsService.disconnect).toHaveBeenCalled();
  });

  it('debería cambiar la pestaña activa correctamente', () => {
    // ACT
    component.cambiarPestana('parametros');

    // ASSERT
    expect(component.pestanaActiva).toBe('parametros');
  });

  it('debería agregar un módulo a la selección si no estaba seleccionado', () => {
    // ARRANGE
    const moduloPrueba: ActividadEmparejamiento = { id: '1', titulo: 'Prueba' } as any;
    component.modulosSeleccionados = [];

    // ACT
    component.toggleModulo(moduloPrueba);

    // ASSERT
    expect(component.modulosSeleccionados.length).toBe(1);
    expect(component.modulosSeleccionados[0].id).toBe('1');
    expect(component.estaSeleccionado('1')).toBeTrue();
  });

  it('debería quitar un módulo de la selección si ya estaba seleccionado', () => {
    // ARRANGE
    const moduloPrueba: ActividadEmparejamiento = { id: '1', titulo: 'Prueba' } as any;
    component.modulosSeleccionados = [moduloPrueba];

    // ACT
    component.toggleModulo(moduloPrueba);

    // ASSERT
    expect(component.modulosSeleccionados.length).toBe(0);
    expect(component.estaSeleccionado('1')).toBeFalse();
  });

  it('debería mover un módulo hacia arriba en el orden', () => {
    // ARRANGE
    const mod1: ActividadEmparejamiento = { id: '1', titulo: 'Mod1' } as any;
    const mod2: ActividadEmparejamiento = { id: '2', titulo: 'Mod2' } as any;
    component.modulosSeleccionados = [mod1, mod2];

    // ACT
    component.subirOrden(1);

    // ASSERT
    expect(component.modulosSeleccionados[0].id).toBe('2');
    expect(component.modulosSeleccionados[1].id).toBe('1');
  });
});