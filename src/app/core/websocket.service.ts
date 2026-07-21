import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface WsEvent {
  event: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messages = new Subject<WsEvent>();

  connect(sessionId: number): void {
    if (this.ws) this.disconnect();
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
      } catch { /* ignore */ }
    };
    this.ws.onerror = () => console.error('[WS] Error');
    this.ws.onclose = () => console.log('[WS] Desconectado');
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onEvent(): Observable<WsEvent> {
    return this.messages.asObservable();
  }
}
