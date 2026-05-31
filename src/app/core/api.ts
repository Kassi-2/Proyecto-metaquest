import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ActividadEmparejamiento } from './model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api'; 

  //ARREGLO PROVISORIO - CAMBIAR
  obtenerProblemas(): Observable<ActividadEmparejamiento[]> {
    const modulosMock: ActividadEmparejamiento[] = [
      {
        id: '1',
        titulo: 'Anatomía Dental Básica',
        asignatura: 'Odontología',
        descripcion: 'Empareja el nombre de la pieza dental con su función principal durante la masticación.',
        pares: [
          { concepto: 'Incisivos', definicion: 'Dientes frontales encargados de cortar los alimentos.' },
          { concepto: 'Molares', definicion: 'Piezas posteriores diseñadas para triturar y moler.' }
        ]
      },
      {
        id: '2',
        titulo: 'Conceptos de Ciberseguridad',
        asignatura: 'Ingeniería Informática',
        descripcion: 'Une el tipo de ataque cibernético con su definición y comportamiento correcto.',
        pares: [
          { concepto: 'Ransomware', definicion: 'Malware que encripta los datos y exige un pago.' },
          { concepto: 'Phishing', definicion: 'Suplantación de identidad corporativa para robar credenciales.' }
        ]
      }
    ];
    return of(modulosMock);
  }

obtenerModuloPorId(id: string): Observable<ActividadEmparejamiento> {
  return of({
    id: id,
    titulo: 'Anatomía Dental Básica',
    asignatura: 'Odontología',
    descripcion: 'Empareja el nombre de la pieza dental con su función principal.',
    pares: [
      { concepto: 'Incisivos', definicion: 'Dientes frontales encargados de cortar los alimentos.' },
      { concepto: 'Molares', definicion: 'Piezas posteriores diseñadas para triturar y moler.' }
    ]
  });
}

crearModulo(modulo: ActividadEmparejamiento): Observable<any> {
  return this.http.post(`${this.apiUrl}/modulos`, modulo);
}

actualizarModulo(id: string, modulo: ActividadEmparejamiento): Observable<any> {
  return this.http.put(`${this.apiUrl}/modulos/${id}`, modulo);
}
}