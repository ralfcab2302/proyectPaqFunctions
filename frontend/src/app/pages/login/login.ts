import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { TranslateModule } from '@ngx-translate/core';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private idiomaService = inject(IdiomaService);

  correo = '';
  contrasena = '';
  error = signal('');
  cargando = signal(false);

  constructor() {
    console.log('🔑 Login constructor - Iniciando componente');
    console.log('🔑 Idioma actual en login:', this.idiomaService.idiomaActual());
  }

  comprobarUser() {
    this.cargando.set(true);
    this.error.set('');

    this.auth.login(this.correo, this.contrasena).subscribe({
      next: (data) => {
        this.cargando.set(false);
        this.auth.guardarSesion(data);
        if (data.usuario.rol === 'usuario') {
          this.router.navigate(['/busqueda']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.error.set('login.error' );
        this.cargando.set(false);
      },
    });
  }
}