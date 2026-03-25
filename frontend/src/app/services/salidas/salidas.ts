import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EstadisticasResponse, Salida } from '../../models/models';

@Injectable({
  providedIn: 'root',
})
export class Salidas {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(params?: {
    nro_salida?: number;
    codigo_barras?: string;
    desde?: string;
    hasta?: string;
    codigo_empresa?: number;
    estado?: string;
    pagina?: number;
    limite?: number;
  }) {
    return this.http.get<{
      salidas: Salida[];
      total: number;
      pagina: number;
      limite: number;
      paginas: number;
    }>(`${this.apiUrl}/salidas`, { params: params as any });
  }

  getById(id: number) {
    return this.http.get<Salida>(`${this.apiUrl}/salidas/${id}`);
  }

  buscarPorCodigoBarras(codigo_barras: string) {
    return this.http.get<{ historial: Salida[]; total: number }>(`${this.apiUrl}/salidas/buscar/${codigo_barras}`);
  }

  update(id: number, data: Partial<Salida>) {
    return this.http.put<Salida>(`${this.apiUrl}/salidas/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/salidas/${id}`);
  }

  estadisticas(params?: { desde?: string; hasta?: string }) {
    return this.http.get<EstadisticasResponse>(`${this.apiUrl}/salidas/estadisticas`, {
      params: params as any,
    });
  }
}