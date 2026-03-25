import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class Usuarios {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() {
    return this.http.get<{ usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`);
  }
  getById(id: number) {
    return this.http.get<{ usuario: Usuario }>(`${this.apiUrl}/usuarios/${id}`);
  }
  create(data: {
    correo: string;
    contrasena: string;
    rol: string;
    codigo_empresa?: number | null;
  }) {
    return this.http.post<{ mensaje: string; usuario: Usuario }>(`${this.apiUrl}/usuarios`, data);
  }
  update(id: number, data: { correo?: string; contrasena?: string; rol?: string }) {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}`, data);
  }
  remove(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}`);
  }
  cambiarContrasena(contrasenaActual: string, contrasenaNueva: string) {
    return this.http.put(`${this.apiUrl}/usuarios/me/contrasena`, {
      contrasenaActual,
      contrasenaNueva,
    });
  }
  resetContrasena(id: number, contrasenaNueva: string) {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}/contrasena`, { contrasenaNueva });
  }
}
