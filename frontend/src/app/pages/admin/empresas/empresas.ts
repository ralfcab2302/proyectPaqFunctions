import { Component, inject, OnInit, signal } from '@angular/core';
import { Nabvar } from '../../nabvar/nabvar';
import { EmpresaService } from '../../../services/empresa';
import { Empresa } from '../../../models/models';

@Component({
  selector: 'app-admin-empresas',
  imports: [Nabvar],
  templateUrl: './empresas.html',
})
export class AdminEmpresas implements OnInit {
  private empresaService = inject(EmpresaService);

  protected empresas = signal<Empresa[]>([]);
  protected cargando = signal(true);
  protected error = signal('');
  protected exito = signal('');

  // Modal
  protected modalAbierto = signal(false);
  protected modoEditar = signal(false);
  protected empresaSeleccionada = signal<Empresa | null>(null);
  protected formNombre = signal('');
  protected formContacto = signal('');
  protected guardando = signal(false);

  // Confirm eliminar
  protected confirmEliminar = signal<number | null>(null);

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.empresaService.getAll().subscribe({
      next: (res) => { this.empresas.set(res.empresas); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar empresas'); this.cargando.set(false); }
    });
  }

  protected abrirCrear() {
    this.modoEditar.set(false);
    this.empresaSeleccionada.set(null);
    this.formNombre.set('');
    this.formContacto.set('');
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected abrirEditar(e: Empresa) {
    this.modoEditar.set(true);
    this.empresaSeleccionada.set(e);
    this.formNombre.set(e.nombre);
    this.formContacto.set(e.contacto || '');
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected cerrarModal() {
    this.modalAbierto.set(false);
    this.error.set('');
  }

  protected guardar() {
    const nombre = this.formNombre().trim();
    if (!nombre) { this.error.set('El nombre es obligatorio'); return; }
    this.guardando.set(true);
    this.error.set('');

    const data = { nombre, contacto: this.formContacto().trim() || undefined };

    if (this.modoEditar()) {
      const id = this.empresaSeleccionada()!.codigo;
      this.empresaService.update(id, data).subscribe({
        next: () => { this.exito.set('Empresa actualizada'); this.cerrarModal(); this.cargar(); this.guardando.set(false); setTimeout(() => this.exito.set(''), 3000); },
        error: (err) => { this.error.set(err.error?.mensaje || 'Error al actualizar'); this.guardando.set(false); }
      });
    } else {
      this.empresaService.create(data).subscribe({
        next: () => { this.exito.set('Empresa creada'); this.cerrarModal(); this.cargar(); this.guardando.set(false); setTimeout(() => this.exito.set(''), 3000); },
        error: (err) => { this.error.set(err.error?.mensaje || 'Error al crear'); this.guardando.set(false); }
      });
    }
  }

  protected pedirConfirmEliminar(id: number) {
    this.confirmEliminar.set(id);
  }

  protected eliminar(id: number) {
    this.empresaService.remove(id).subscribe({
      next: () => { this.exito.set('Empresa eliminada'); this.confirmEliminar.set(null); this.cargar(); setTimeout(() => this.exito.set(''), 3000); },
      error: (err) => { this.error.set(err.error?.mensaje || 'Error al eliminar'); this.confirmEliminar.set(null); }
    });
  }
}
