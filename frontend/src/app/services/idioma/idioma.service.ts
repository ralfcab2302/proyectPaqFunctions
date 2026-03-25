import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private readonly STORAGE_KEY = 'idioma';
  private readonly DEFAULT_IDIOMA = 'es';

  private translate = inject(TranslateService);

  /** Signal público que refleja el idioma activo */
  public idiomaActual = signal<string>(this.DEFAULT_IDIOMA);

  constructor() {
    const guardado = localStorage.getItem(this.STORAGE_KEY) ?? this.DEFAULT_IDIOMA;
    this.idiomaActual.set(guardado);
    this.translate.setDefaultLang(this.DEFAULT_IDIOMA);
    this.translate.use(guardado);
  }

  cambiarIdioma(idioma: string): void {
    if (idioma === this.idiomaActual()) return;
    this.idiomaActual.set(idioma);
    this.translate.use(idioma);
    localStorage.setItem(this.STORAGE_KEY, idioma);
  }

  toggleIdioma(): void {
    const nuevo = this.idiomaActual() === 'es' ? 'en' : 'es';
    this.cambiarIdioma(nuevo);
  }
}
