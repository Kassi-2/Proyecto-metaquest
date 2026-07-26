import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorComponent } from './editor';
import { ApiService } from '../../core/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: any;
  let mockToast: any;

  beforeEach(async () => {
    // ARRANGE
    mockApiService = jasmine.createSpyObj('ApiService', [
      'obtenerModuloPorId',
      'crearModulo',
      'actualizarModulo'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    mockToast = { fire: jasmine.createSpy('fire') };
    spyOn(Swal, 'mixin').and.returnValue(mockToast as any);
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    await TestBed.configureTestingModule({
      imports: [EditorComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    
  });


  it('debería inicializar en Modo Creación con un formulario vacío y un par por defecto', () => {
    fixture.detectChanges(); // Dispara ngOnInit
    
    expect(component.esModoEdicion).toBeFalse();
    expect(component.editorForm).toBeDefined();
    expect(component.editorForm.valid).toBeFalse(); // Inválido porque está vacío
    expect(component.paresFormArray.length).toBe(1); // Debe traer 1 par por defecto
  });

  it('debería inicializar en Modo Edición, cargar los datos y rellenar el formulario', () => {
    // ARRANGE: Simular que la URL tiene el ID 123
    mockRoute.snapshot.paramMap.get.and.returnValue('123');
    
    const moduloMock = {
      titulo: 'Glosario Dental',
      asignatura: 'Odontología',
      descripcion: 'Términos básicos',
      pares: [{ concepto: 'Esmalte', definicion: 'Capa externa', descripcion: '' }]
    };
    mockApiService.obtenerModuloPorId.and.returnValue(of(moduloMock as any));
    // ACT
    fixture.detectChanges();

    // ASSERT
    expect(component.esModoEdicion).toBeTrue();
    expect(mockApiService.obtenerModuloPorId).toHaveBeenCalledWith('123');
    expect(component.editorForm.value.titulo).toBe('Glosario Dental');
    expect(component.paresFormArray.length).toBe(1);
    expect(component.paresFormArray.at(0).value.concepto).toBe('Esmalte');
    expect(component.editorForm.valid).toBeTrue(); 
  });


  it('debería agregar y eliminar pares, pero impedir dejar la lista vacía', () => {
    fixture.detectChanges();
    component.agregarPar('Concepto 2', 'Def 2', '');
    expect(component.paresFormArray.length).toBe(2);
    component.eliminarPar(1);
    expect(component.paresFormArray.length).toBe(1);
    component.eliminarPar(0);
    // ASSERT
    expect(component.paresFormArray.length).toBe(1);
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Acción no permitida' }));
  });

  it('no debería enviar peticiones si el formulario está incompleto', () => {
    fixture.detectChanges(); 
    // Intentar guardar estando vacío
    component.guardarModulo();

    expect(mockApiService.crearModulo).not.toHaveBeenCalled();
    expect(mockApiService.actualizarModulo).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'warning' }));
  });

  it('debería guardar exitosamente un nuevo módulo y navegar al dashboard', () => {
    fixture.detectChanges();
    
    // ARRANGE
    component.editorForm.patchValue({
      titulo: 'Módulo Válido',
      asignatura: 'Asignatura X',
      descripcion: 'Una descripción válida'
    });
    component.paresFormArray.at(0).patchValue({
      concepto: 'A',
      definicion: 'B'
    });
    
    mockApiService.crearModulo.and.returnValue(of({} as any));

    // ACT
    component.guardarModulo();

    // ASSERT
    expect(mockApiService.crearModulo).toHaveBeenCalledWith(component.editorForm.value);
    expect(mockToast.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success' }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debería actualizar un módulo existente y navegar al dashboard', () => {
    // ARRANGE
    mockRoute.snapshot.paramMap.get.and.returnValue('456');
    mockApiService.obtenerModuloPorId.and.returnValue(of({
      titulo: 'Título', asignatura: 'Asig', descripcion: 'Desc',
      pares: [{ concepto: 'C', definicion: 'D', descripcion: '' }]
    } as any));
    
    fixture.detectChanges(); // Se carga y el formulario ya es válido

    mockApiService.actualizarModulo.and.returnValue(of({} as any));

    // ACT
    component.guardarModulo();

    // ASSERT
    expect(mockApiService.actualizarModulo).toHaveBeenCalledWith('456', component.editorForm.value);
    expect(mockToast.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success' }));
  });

  it('debería mostrar un error genérico si falla el servidor al crear', () => {
    fixture.detectChanges();
    
    component.editorForm.patchValue({ titulo: 'Valid', asignatura: 'A', descripcion: 'D' });
    component.paresFormArray.at(0).patchValue({ concepto: 'C', definicion: 'D' });
    
    // Simular fallo 500 del servidor
    mockApiService.crearModulo.and.returnValue(throwError(() => new Error('Error 500')));

    // ACT
    component.guardarModulo();

    // ASSERT
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Error de Conexión' }));
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});