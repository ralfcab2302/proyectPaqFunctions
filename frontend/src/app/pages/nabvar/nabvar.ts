import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { TranslateModule } from '@ngx-translate/core';
import { IdiomaService } from '../../services/idioma/idioma.service';

@Component({
  selector: 'app-nabvar',
  imports: [TranslateModule],
  templateUrl: './nabvar.html',
  styleUrl: './nabvar.css',
})
export class Nabvar implements OnInit {
  protected rolUser = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).rol
    : null;
  protected correoUser = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).correo
    : null;

  private authService = inject(AuthService);
  protected router = inject(Router);
  protected idiomaService = inject(IdiomaService);

  protected rutaActual  = signal('');
  protected menuAbierto = signal(false);

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.rutaActual.set(event.url);
        this.menuAbierto.set(false);
      }
    });
    this.rutaActual.set(this.router.url);
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected cambiarIdioma() {
    this.idiomaService.toggleIdioma();
  }

  esSuperadmin() { return this.rolUser === 'superadmin'; }
  esAdmin() { return this.rolUser === 'superadmin' || this.rolUser === 'admin'; }
  estaEn(ruta: string) { return this.rutaActual() === ruta; }
}
