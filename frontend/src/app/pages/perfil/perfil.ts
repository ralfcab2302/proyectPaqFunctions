import { Component, inject, signal } from '@angular/core';
import { Nabvar } from '../nabvar/nabvar';
import { AuthService } from '../../services/auth';
import { Usuarios } from '../../services/usuarios';

@Component({
  selector: 'app-perfil',
  imports: [Nabvar],
  templateUrl: './perfil.html',
})
export class Perfil {
  private authService = inject(AuthService);
  private usuariosService = inject(Usuarios);

  protected usuario = this.authService.getUsuario();

  protected contrasenaActual  = signal('');
  protected contrasenaNueva   = signal('');
  protected contrasenaConfirm = signal('');
  protected guardando = signal(false);
  protected exito     = signal('');
  protected error     = signal('');

  protected guardar() {
    const actual   = this.contrasenaActual().trim();
    const nueva    = this.contrasenaNueva().trim();
    const confirm  = this.contrasenaConfirm().trim();

    // Validaciones en el frontend antes de llamar al backend
    if (!actual)  { this.error.set('Debes introducir tu contraseña actual'); return; }
    if (!nueva)   { this.error.set('La nueva contraseña no puede estar vacía'); return; }
    if (nueva.length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres'); return; }
    if (nueva !== confirm) { this.error.set('Las contraseñas nuevas no coinciden'); return; }
    if (actual === nueva)  { this.error.set('La nueva contraseña debe ser diferente a la actual'); return; }

    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');

    this.usuariosService.cambiarContrasena(actual, nueva).subscribe({
      next: () => {
        this.exito.set('Contraseña actualizada correctamente');
        this.contrasenaActual.set('');
        this.contrasenaNueva.set('');
        this.contrasenaConfirm.set('');
        this.guardando.set(false);
        setTimeout(() => this.exito.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al actualizar la contraseña');
        this.guardando.set(false);
      }
    });
  }
}