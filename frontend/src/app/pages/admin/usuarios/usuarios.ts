import { Component, inject, OnInit, signal } from '@angular/core';
import { Nabvar } from '../../nabvar/nabvar';
import { Usuarios } from '../../../services/usuarios';
import { EmpresaService } from '../../../services/empresa';
import { Usuario, Empresa } from '../../../models/models';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-usuarios',
  imports: [Nabvar],
  templateUrl: './usuarios.html',
})
export class AdminUsuarios implements OnInit {
  private usuariosService = inject(Usuarios);
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);

  protected usuarios = signal<Usuario[]>([]);
  protected empresas = signal<Empresa[]>([]);
  protected cargando = signal(true);
  protected error = signal('');
  protected exito = signal('');
  protected rolActual = this.authService.getUsuario()?.rol;

  // Modal
  protected modalAbierto = signal(false);
  protected modoEditar = signal(false);
  protected usuarioSeleccionado = signal<Usuario | null>(null);
  protected formCorreo = signal('');
  protected formContrasena = signal('');
  protected formRol = signal('usuario');
  protected formEmpresa = signal<number | null>(null);
  protected guardando = signal(false);

  protected confirmEliminar = signal<number | null>(null);

  ngOnInit() {
    this.cargar();
    if (this.rolActual === 'superadmin') {
      this.empresaService.getAll().subscribe({
        next: (res) => this.empresas.set(res.empresas)
      });
    }
  }

  private cargar() {
    this.cargando.set(true);
    this.usuariosService.getAll().subscribe({
      next: (res) => { this.usuarios.set(res.usuarios); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar usuarios'); this.cargando.set(false); }
    });
  }

  protected abrirCrear() {
    this.modoEditar.set(false);
    this.usuarioSeleccionado.set(null);
    this.formCorreo.set('');
    this.formContrasena.set('');
    this.formRol.set('usuario');
    this.formEmpresa.set(null);
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected abrirEditar(u: Usuario) {
    this.modoEditar.set(true);
    this.usuarioSeleccionado.set(u);
    this.formCorreo.set(u.correo);
    this.formContrasena.set('');
    this.formRol.set(u.rol);
    this.formEmpresa.set(u.codigo_empresa);
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected cerrarModal() {
    this.modalAbierto.set(false);
    this.error.set('');
  }

  protected guardar() {
    const correo = this.formCorreo().trim();
    if (!correo) { this.error.set('El correo es obligatorio'); return; }
    if (!this.modoEditar() && !this.formContrasena()) { this.error.set('La contraseña es obligatoria'); return; }

    this.guardando.set(true);
    this.error.set('');

    if (this.modoEditar()) {
      const data: any = { correo };
      if (this.formContrasena()) data.contrasena = this.formContrasena();
      if (this.rolActual === 'superadmin') data.rol = this.formRol();

      this.usuariosService.update(this.usuarioSeleccionado()!.codigo_usuario, data).subscribe({
        next: () => { this.exito.set('Usuario actualizado'); this.cerrarModal(); this.cargar(); this.guardando.set(false); setTimeout(() => this.exito.set(''), 3000); },
        error: (err) => { this.error.set(err.error?.mensaje || 'Error al actualizar'); this.guardando.set(false); }
      });
    } else {
      const data: any = {
        correo,
        contrasena: this.formContrasena(),
        rol: this.formRol(),
        codigo_empresa: this.formEmpresa()
      };
      this.usuariosService.create(data).subscribe({
        next: () => { this.exito.set('Usuario creado'); this.cerrarModal(); this.cargar(); this.guardando.set(false); setTimeout(() => this.exito.set(''), 3000); },
        error: (err) => { this.error.set(err.error?.mensaje || 'Error al crear'); this.guardando.set(false); }
      });
    }
  }

  protected pedirConfirmEliminar(id: number) { this.confirmEliminar.set(id); }

  protected eliminar(id: number) {
    this.usuariosService.remove(id).subscribe({
      next: () => { this.exito.set('Usuario eliminado'); this.confirmEliminar.set(null); this.cargar(); setTimeout(() => this.exito.set(''), 3000); },
      error: (err) => { this.error.set(err.error?.mensaje || 'Error al eliminar'); this.confirmEliminar.set(null); }
    });
  }

  protected rolBadgeClass(rol: string): string {
    if (rol === 'superadmin') return 'bg-purple-900/50 text-purple-400 border border-purple-700';
    if (rol === 'admin') return 'bg-blue-900/50 text-blue-400 border border-blue-700';
    return 'bg-slate-700 text-slate-400 border border-slate-600';
  }
}
