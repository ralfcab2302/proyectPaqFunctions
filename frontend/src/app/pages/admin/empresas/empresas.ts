import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Nabvar } from '../../nabvar/nabvar';
import { EmpresaService } from '../../../services/empresa/empresa';
import { Empresa } from '../../../models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-empresas',
  imports: [Nabvar, TranslateModule, FormsModule],
  templateUrl: './empresas.html',
})
export class AdminEmpresas implements OnInit {
  private empresaService = inject(EmpresaService);
  private translate = inject(TranslateService);

  protected empresas = signal<Empresa[]>([]);
  protected cargando = signal(true);
  protected error = signal('');
  protected exito = signal('');

  // Filtros inline
  protected filtroNombre = signal('');
  protected filtroContacto = signal('');
  protected ordenNombre = signal<'asc' | 'desc' | ''>('');

  protected empresasFiltradas = computed(() => {
    let lista = [...this.empresas()];

    const nombre = this.filtroNombre().toLowerCase().trim();
    const contacto = this.filtroContacto().toLowerCase().trim();

    if (nombre) lista = lista.filter((e) => e.nombre.toLowerCase().includes(nombre));
    if (contacto) lista = lista.filter((e) => (e.contacto || '').toLowerCase().includes(contacto));

    if (this.ordenNombre() === 'asc') lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    else if (this.ordenNombre() === 'desc') lista.sort((a, b) => b.nombre.localeCompare(a.nombre));

    return lista;
  });

  protected modalAbierto = signal(false);
  protected modoEditar = signal(false);
  protected empresaSeleccionada = signal<Empresa | null>(null);
  protected formNombre = signal('');
  protected formContacto = signal('');
  protected guardando = signal(false);
  protected confirmEliminar = signal<number | null>(null);

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.empresaService.getAll().subscribe({
      next: (res) => {
        this.empresas.set(res.empresas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('empresas.errorCargar'));
        this.cargando.set(false);
      },
    });
  }

  protected toggleOrden() {
    if (this.ordenNombre() === '') this.ordenNombre.set('asc');
    else if (this.ordenNombre() === 'asc') this.ordenNombre.set('desc');
    else this.ordenNombre.set('');
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
    if (!nombre) {
      this.error.set(this.translate.instant('empresas.errorNombreObligatorio'));
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const data = { nombre, contacto: this.formContacto().trim() || undefined };

    if (this.modoEditar()) {
      const id = this.empresaSeleccionada()!.codigo;
      this.empresaService.update(id, data).subscribe({
        next: () => {
          this.exito.set(this.translate.instant('empresas.actualizada'));
          this.cerrarModal();
          this.cargar();
          this.guardando.set(false);
          setTimeout(() => this.exito.set(''), 3000);
        },
        error: (err) => {
          this.error.set(err.error?.mensaje || this.translate.instant('comun.errorServidor'));
          this.guardando.set(false);
        },
      });
    } else {
      this.empresaService.create(data).subscribe({
        next: () => {
          this.exito.set(this.translate.instant('empresas.creada'));
          this.cerrarModal();
          this.cargar();
          this.guardando.set(false);
          setTimeout(() => this.exito.set(''), 3000);
        },
        error: (err) => {
          this.error.set(err.error?.mensaje || this.translate.instant('comun.errorServidor'));
          this.guardando.set(false);
        },
      });
    }
  }

  protected pedirConfirmEliminar(id: number) {
    this.confirmEliminar.set(id);
  }

  protected eliminar(id: number) {
    this.empresaService.remove(id).subscribe({
      next: () => {
        this.exito.set(this.translate.instant('empresas.eliminada'));
        this.confirmEliminar.set(null);
        this.cargar();
        setTimeout(() => this.exito.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || this.translate.instant('comun.errorServidor'));
        this.confirmEliminar.set(null);
      },
    });
  }
}
