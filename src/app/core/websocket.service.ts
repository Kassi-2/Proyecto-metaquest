import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Define la estructura estándar de los mensajes que se envían y reciben 
 * a través de la conexión WebSocket.
 */
export interface WsEvent {
  /** Nombre o identificador del evento (ej. 'LOGIN_PLAYER', 'SCORE_UPDATE'). */
  event: string;
  /** Carga útil (payload) dinámica que contiene la información del evento. */
  data: any;
}

/**
 * Servicio encargado de gestionar la comunicación bidireccional en tiempo real.
 * Actúa como puente entre el panel de control del profesor (frontend) y el servidor, 
 * permitiendo monitorear e interactuar con la aplicación VR/XR mientras la sesión está en curso.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  /** Instancia nativa de la conexión WebSocket. */
  private ws: WebSocket | null = null;
  
  /** 
   * Sujeto de RxJS (Subject) que actúa como un bus de eventos interno.
   * Permite que múltiples componentes se suscriban a los mensajes entrantes de forma reactiva.
   */
  private messages = new Subject<WsEvent>();

  /**
   * Establece una nueva conexión WebSocket con el servidor y configura los manejadores de eventos.
   * Al abrirse la conexión, emite inmediatamente un evento 'LOGIN_PLAYER' para registrar 
   * esta conexión específica como la consola administrativa del profesor.
   * 
   * @param sessionId - El identificador único de la sesión de clase actual.
   */
  connect(sessionId: number): void {
    if (this.ws) this.disconnect();
    
    // Inicializa la conexión apuntando al servidor backend (ajustar URL según el entorno de despliegue)
    this.ws = new WebSocket('ws://localhost:3000');
    
    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({
        event: 'LOGIN_PLAYER',
        data: { studentId: 'CONSOLA_PROFESOR', sessionId },
      }));
    };
    
    this.ws.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        this.messages.next(parsed);
      } catch { 
        // Si el mensaje no es un JSON válido, se ignora silenciosamente para evitar caídas
      }
    };
    
    this.ws.onerror = () => console.error('[WS] Error de conexión');
    this.ws.onclose = () => console.log('[WS] Desconectado');
  }

  /**
   * Cierra la conexión WebSocket activa de manera segura y libera la referencia,
   * previniendo fugas de memoria o conexiones fantasma.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Expone un flujo observable de los eventos entrantes del WebSocket.
   * Los componentes (como la vista de configuración de clase) deben suscribirse a este método
   * para reaccionar a los cambios que ocurren en tiempo real dentro de la sesión VR.
   * 
   * @returns Un Observable que emite objetos de tipo `WsEvent`.
   */
  onEvent(): Observable<WsEvent> {
    return this.messages.asObservable();
  }
}