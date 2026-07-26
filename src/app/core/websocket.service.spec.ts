import { TestBed } from '@angular/core/testing';
import { WebSocketService, WsEvent } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocketInstance: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketService);

    // ARRANGE:
    mockWebSocketInstance = {
      send: jasmine.createSpy('send'),
      close: jasmine.createSpy('close'),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    };

    spyOn(window as any, 'WebSocket').and.returnValue(mockWebSocketInstance);
  });

  it('debería inicializar la conexión y enviar el evento LOGIN_PLAYER al abrirse', () => {
    const sessionId = 42;
    
    // ACT
    service.connect(sessionId);

    // ASSERT: Verificar que se intentó crear una conexión a la URL correcta
    expect(window.WebSocket).toHaveBeenCalledWith('ws://localhost:3000');
    
    // Simular que el servidor aceptó la conexión disparando el evento onopen
    mockWebSocketInstance.onopen();
    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'LOGIN_PLAYER',
      data: { studentId: 'CONSOLA_PROFESOR', sessionId: 42 }
    }));
  });

  it('debería cerrar la conexión anterior si se llama a connect() teniendo una activa', () => {
    // ARRANGE: Conectar la primera vez
    service.connect(1);
    
    // ACT: Conectar por segunda vez
    service.connect(2);

    // ASSERT: Debe haber cerrado la primera conexión antes de abrir la nueva
    expect(mockWebSocketInstance.close).toHaveBeenCalledTimes(1);
    expect(window.WebSocket).toHaveBeenCalledTimes(2); // Se instanció 2 veces
  });


  it('debería emitir los eventos entrantes a través del Observable si el JSON es válido', (done) => {
    service.connect(1);

    const mockEventFromServer = { event: 'SCORE_UPDATE', data: { score: 100 } };
    service.onEvent().subscribe((wsEvent: WsEvent) => {
      // ASSERT: Verificar que el componente reciba exactamente lo que mandó el servidor
      expect(wsEvent.event).toBe('SCORE_UPDATE');
      expect(wsEvent.data.score).toBe(100);
      done();
    });

    // Simular que el servidor nos envía un mensaje de texto
    const msgEvent = { data: JSON.stringify(mockEventFromServer) };
    mockWebSocketInstance.onmessage(msgEvent);
  });

  it('debería ignorar silenciosamente los mensajes si el JSON es inválido', () => {
    service.connect(1);
    const espiaObservable = jasmine.createSpy('espiaObservable');
    
    service.onEvent().subscribe(espiaObservable);

    // ACT: Simular un mensaje roto desde el servidor
    mockWebSocketInstance.onmessage({ data: 'esto-no-es-json' });

    // ASSERT: El try/catch debe capturar el error y NO emitir nada al resto de la app
    expect(espiaObservable).not.toHaveBeenCalled();
  });


  it('debería cerrar la conexión y limpiar la referencia al llamar a disconnect()', () => {
    service.connect(1);
    
    // ACT
    service.disconnect();

    // ASSERT
    expect(mockWebSocketInstance.close).toHaveBeenCalled();
    service.disconnect();
    expect(mockWebSocketInstance.close).toHaveBeenCalledTimes(1); 
  });

  it('debería manejar los eventos onclose y onerror sin romper la aplicación', () => {
    service.connect(1);
    spyOn(console, 'error');
    spyOn(console, 'log');

    // ACT: Simular caídas de red
    mockWebSocketInstance.onerror();
    mockWebSocketInstance.onclose();

    // ASSERT
    expect(console.error).toHaveBeenCalledWith('[WS] Error de conexión');
    expect(console.log).toHaveBeenCalledWith('[WS] Desconectado');
  });
});