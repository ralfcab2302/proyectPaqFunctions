import { Component, inject, signal } from '@angular/core';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas/salidas';
import { Salida } from '../../models/models';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-busqueda',
  imports: [Nabvar, TranslateModule, FormsModule, DatePipe],
  templateUrl: './busqueda.html',
  styleUrl: './busqueda.css',
})
export class Busqueda {
  private salidas = inject(Salidas);

  protected codigo = signal('');
  protected cargando = signal(false);
  protected resultado = signal<Salida[]>([]);
  protected buscado = signal(false);

  // Edición: signal solo indica si el modal está abierto (guarda el id)
  protected editandoId = signal<number | null>(null);

  // Variables planas para el formulario — ngModel las muta directamente sin problema
  protected formCodBarras = '';
  protected formNroSalida = 0;
  protected formFecha = '';

  protected guardando = signal(false);

  // Eliminar
  protected confirmandoEliminar = signal<number | null>(null);

  protected rolUser: string = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).rol
    : '';

  protected esAdmin() {
    return this.rolUser === 'admin' || this.rolUser === 'superadmin';
  }

  protected buscar() {
    const cod = this.codigo().trim();
    if (!cod) return;

    this.cargando.set(true);
    this.buscado.set(false);
    this.editandoId.set(null);
    this.confirmandoEliminar.set(null);

    this.salidas.buscarPorCodigoBarras(cod).subscribe({
      next: (res: any) => {
        this.resultado.set(res.historial ?? res.salidas ?? []);
        this.buscado.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.resultado.set([]);
        this.buscado.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected limpiar() {
    this.codigo.set('');
    this.resultado.set([]);
    this.buscado.set(false);
    this.editandoId.set(null);
    this.confirmandoEliminar.set(null);
  }

  // --- Editar ---
  protected abrirEditar(s: Salida) {
    // Cargamos los valores en las variables planas del formulario
    this.formCodBarras = s.codigo_barras;
    this.formNroSalida = s.nro_salida;
    this.formFecha = s.fecha_salida ? s.fecha_salida.toString().slice(0, 10) : '';
    this.editandoId.set(s.codigo);
    this.confirmandoEliminar.set(null);
  }

  protected cancelarEditar() {
    this.editandoId.set(null);
  }

  protected guardarEditar() {
    const id = this.editandoId();
    if (id === null) return;
    this.guardando.set(true);

    this.salidas.update(id, {
      codigo_barras: this.formCodBarras,
      nro_salida: this.formNroSalida,
      fecha_salida: this.formFecha,
    }).subscribe({
      next: (updated) => {
        this.resultado.update(lista =>
          lista.map(item => item.codigo === updated.codigo ? updated : item)
        );
        this.editandoId.set(null);
        this.guardando.set(false);
      },
      error: () => this.guardando.set(false),
    });
  }

  // --- Eliminar ---
  protected pedirConfirmacion(id: number) {
    this.confirmandoEliminar.set(id);
    this.editandoId.set(null);
  }

  protected cancelarEliminar() {
    this.confirmandoEliminar.set(null);
  }

  protected confirmarEliminar(id: number) {
    this.salidas.delete(id).subscribe({
      next: () => {
        this.resultado.update(lista => lista.filter(s => s.codigo !== id));
        this.confirmandoEliminar.set(null);
      },
    });
  }
}
