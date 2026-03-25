import { Component, inject, signal } from '@angular/core';
import { Nabvar } from '../nabvar/nabvar';
import { AuthService } from '../../services/auth/auth';
import { Usuarios } from '../../services/usuarios/usuarios';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IdiomaService } from '../../services/idioma/idioma.service';

@Component({
  selector: 'app-perfil',
  imports: [Nabvar, TranslateModule],
  templateUrl: './perfil.html',
})
export class Perfil {
  private authService     = inject(AuthService);
  private usuariosService = inject(Usuarios);
  private translate       = inject(TranslateService);
  private idiomaService   = inject(IdiomaService);

  protected usuario = this.authService.getUsuario();

  protected contrasenaActual  = signal('');
  protected contrasenaNueva   = signal('');
  protected contrasenaConfirm = signal('');
  protected guardando = signal(false);
  protected exito     = signal('');
  protected error     = signal('');

  protected guardar() {
    const actual  = this.contrasenaActual().trim();
    const nueva   = this.contrasenaNueva().trim();
    const confirm = this.contrasenaConfirm().trim();

    if (!actual)           { this.error.set(this.translate.instant('perfil.errorActualVacia'));    return; }
    if (!nueva)            { this.error.set(this.translate.instant('perfil.errorNuevaVacia'));     return; }
    if (nueva.length < 6)  { this.error.set(this.translate.instant('perfil.errorMinCaracteres')); return; }
    if (nueva !== confirm) { this.error.set(this.translate.instant('perfil.errorNoCoinciden'));   return; }
    if (actual === nueva)  { this.error.set(this.translate.instant('perfil.errorIgual'));         return; }

    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');

    this.usuariosService.cambiarContrasena(actual, nueva).subscribe({
      next: () => {
        this.exito.set(this.translate.instant('perfil.exito'));
        this.contrasenaActual.set('');
        this.contrasenaNueva.set('');
        this.contrasenaConfirm.set('');
        this.guardando.set(false);
        setTimeout(() => this.exito.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || this.translate.instant('comun.errorServidor'));
        this.guardando.set(false);
      }
    });
  }
}
