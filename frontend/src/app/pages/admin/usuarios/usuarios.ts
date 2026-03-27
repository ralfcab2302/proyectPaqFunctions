import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Nabvar } from '../../nabvar/nabvar';
import { Usuarios } from '../../../services/usuarios/usuarios';
import { EmpresaService } from '../../../services/empresa/empresa';
import { Usuario, Empresa } from '../../../models/models';
import { AuthService } from '../../../services/auth/auth';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-usuarios',
  imports: [Nabvar, TranslateModule, FormsModule],
  templateUrl: './usuarios.html',
})
export class AdminUsuarios implements OnInit {
  private usuariosService = inject(Usuarios);
  private empresaService  = inject(EmpresaService);
  private authService     = inject(AuthService);

  protected usuarios  = signal<Usuario[]>([]);
  protected empresas  = signal<Empresa[]>([]);
  protected cargando  = signal(true);
  protected error     = signal('');
  protected exito     = signal('');
  protected rolActual = this.authService.getUsuario()?.rol;

  // Filtros inline
  protected filtroCorreo  = signal('');
  protected filtroRol     = signal('');
  protected filtroEmpresa = signal('');

  protected usuariosFiltrados = computed(() => {
    let lista = [...this.usuarios()];

    const correo  = this.filtroCorreo().toLowerCase().trim();
    const rol     = this.filtroRol();
    const empresa = this.filtroEmpresa().toLowerCase().trim();

    if (correo)  lista = lista.filter(u => u.correo.toLowerCase().includes(correo));
    if (rol)     lista = lista.filter(u => u.rol === rol);
    if (empresa) lista = lista.filter(u => (u.nombre_empresa || '').toLowerCase().includes(empresa));

    return lista;
  });

  // Modal editar / crear
  protected modalAbierto        = signal(false);
  protected modoEditar          = signal(false);
  protected usuarioSeleccionado = signal<Usuario | null>(null);
  protected formCorreo          = signal('');
  protected formContrasena      = signal('');
  protected formRol             = signal('usuario');
  protected formEmpresa         = signal<number | null>(null);
  protected guardando           = signal(false);

  // Modal cambio de contraseña
  protected modalContrasenaAbierto = signal(false);
  protected usuarioContrasena      = signal<Usuario | null>(null);
  protected nuevaContrasena        = signal('');
  protected confirmarContrasena    = signal('');
  protected guardandoContrasena    = signal(false);
  protected errorContrasena        = signal('');

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

  protected cerrarModal() { this.modalAbierto.set(false); this.error.set(''); }

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

  protected abrirCambioContrasena(u: Usuario) {
    this.usuarioContrasena.set(u);
    this.nuevaContrasena.set('');
    this.confirmarContrasena.set('');
    this.errorContrasena.set('');
    this.modalContrasenaAbierto.set(true);
  }

  protected cerrarModalContrasena() { this.modalContrasenaAbierto.set(false); this.errorContrasena.set(''); }

  protected guardarContrasena() {
    const nueva     = this.nuevaContrasena().trim();
    const confirmar = this.confirmarContrasena().trim();

    if (!nueva)              { this.errorContrasena.set('La contraseña no puede estar vacía'); return; }
    if (nueva.length < 6)   { this.errorContrasena.set('Mínimo 6 caracteres'); return; }
    if (nueva !== confirmar) { this.errorContrasena.set('Las contraseñas no coinciden'); return; }

    this.guardandoContrasena.set(true);
    this.errorContrasena.set('');

    this.usuariosService.resetContrasena(this.usuarioContrasena()!.codigo_usuario, nueva).subscribe({
      next: () => {
        this.exito.set(`Contraseña de ${this.usuarioContrasena()!.correo} actualizada`);
        this.cerrarModalContrasena();
        this.guardandoContrasena.set(false);
        setTimeout(() => this.exito.set(''), 3000);
      },
      error: (err) => {
        this.errorContrasena.set(err.error?.mensaje || 'Error al actualizar la contraseña');
        this.guardandoContrasena.set(false);
      }
    });
  }

  protected pedirConfirmEliminar(id: number) { this.confirmEliminar.set(id); }

  protected eliminar(id: number) {
    this.usuariosService.remove(id).subscribe({
      next: () => { this.exito.set('Usuario eliminado'); this.confirmEliminar.set(null); this.cargar(); setTimeout(() => this.exito.set(''), 3000); },
      error: (err) => { this.error.set(err.error?.mensaje || 'Error al eliminar'); this.confirmEliminar.set(null); }
    });
  }

  protected rolBadgeClass(rol: string): string {
    if (rol === 'superadmin') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (rol === 'admin')      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-white/[0.04] text-slate-400 border border-white/[0.08]';
  }

  protected puedeResetear(u: Usuario): boolean {
    const yo = this.authService.getUsuario()!;
    if (u.codigo_usuario === yo.codigo_usuario) return false;
    if (yo.rol === 'superadmin') return u.rol !== 'superadmin';
    if (yo.rol === 'admin')      return u.rol === 'usuario';
    return false;
  }
}